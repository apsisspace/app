/**
 * Renders the full active satellite catalog as a single
 * PointPrimitiveCollection — orders of magnitude cheaper than one Entity
 * per satellite. Runs entirely outside React's render cycle after mount.
 *
 * Motion model:
 *   - SGP4-propagate each satellite at 1 Hz, writing into a `next` buffer.
 *     Between samples, we linearly interpolate on every render frame from
 *     `prev` → `next`. This is the same interpolation Cesium's
 *     `SampledPositionProperty` applies internally — but driven per-primitive
 *     so we can stay inside one PointPrimitiveCollection and keep 10k+
 *     satellites cheap.
 *   - A requestAnimationFrame pump calls `scene.requestRender()` every
 *     frame so the visible motion is smooth at the display framerate even
 *     with `requestRenderMode` on. (Per-frame GPU work is tiny — 10k point
 *     billboards render in a single draw call.)
 *
 * Bounded memory by construction:
 *   - Only two samples ever exist per satellite (prev, next), in two
 *     preallocated Float64Arrays. No per-tick allocations, no sample
 *     accumulation. We do NOT use Cesium's SampledPositionProperty (which
 *     would grow unbounded without removeSamples() calls).
 *
 * Timekeeping:
 *   - prev/next sample timestamps are anchored to performance.now() at the
 *     moment each tick fires, not accumulated by adding TICK_MS every tick.
 *     setInterval jitter and tab-background throttling used to let the
 *     bookkeeping clock drift from the real clock; the lerp alpha then
 *     clamped to 1 on every frame and motion froze until drift burned off,
 *     which is the "progressive choppiness after long uptime" symptom.
 *   - On visibilitychange → visible, we reseed both samples so a
 *     backgrounded-for-minutes tab snaps cleanly back to real time.
 *
 * Other responsibilities:
 *   - Left-click picks → selection store.
 *   - Ghost entity + viewer.trackedEntity so camera zoom/orbit is relative
 *     to the selected satellite.
 *   - Orbit polyline (one full period) for the selected satellite.
 *   - Selected point gets a larger pixelSize + teal outline "halo".
 *   - Points scale subtly with camera distance so they stay legible.
 *
 * TODO(server-side-propagation): Move SGP4 to a worker or backend for
 *   larger catalogs. At 10k sats × 1 Hz the main thread spends ~10-20 ms
 *   every second inside satellite.js; it is the single biggest non-GPU
 *   cost left in the render path.
 */

import { useEffect } from 'react'
import { useCesium } from 'resium'
import {
  ArcType,
  CallbackPositionProperty,
  Cartesian3,
  Color,
  Entity,
  NearFarScalar,
  PointPrimitiveCollection,
  ReferenceFrame,
  ScreenSpaceEventHandler,
  ScreenSpaceEventType,
  type PointPrimitive,
} from 'cesium'
import type { Satellite } from '../types/satellite'
import {
  tleToSatRec,
  propagateToGeodetic,
  sampleOrbitEcef,
} from '../lib/propagator'
import { tleMetadata } from '../lib/tleMetadata'
import { useSelectionStore } from '../stores/selection'
import {
  BAND_COLORS,
  BAND_ORBIT_COLORS,
  bandIndexForInclinationDeg,
} from '../lib/inclinationColor'

const TICK_MS = 1000
const ORBIT_SAMPLES = 100

const SELECTED_COLOR = Color.fromCssColorString('#00d4ff')
const SELECTED_OUTLINE = Color.fromCssColorString('#00d4ff').withAlpha(0.5)

const DEFAULT_SIZE = 3
const SELECTED_SIZE = 8
const DEFAULT_OUTLINE_WIDTH = 0
const SELECTED_OUTLINE_WIDTH = 3

// Points at 1.5 Mm from the camera draw 1.3× pixelSize; at 150 Mm, 0.7×.
// Keeps points legible when zoomed in close, and visible from far out,
// without letting them get fuzzy (PointPrimitive scaling is crisp).
const POINT_SCALE_BY_DISTANCE = new NearFarScalar(1.5e6, 1.3, 1.5e8, 0.7)

const TRACK_VIEW_FROM = new Cartesian3(0, -3_000_000, 1_500_000)
const HOME_FLY_SECONDS = 1.0

/** Sentinel for a satellite whose SGP4 call failed (e.g. decayed). */
const INVALID_SAMPLE = Number.NaN

interface PointId {
  type: 'satellite'
  noradId: number
  index: number
}

interface SatelliteLayerProps {
  satellites: Satellite[]
}

export function SatelliteLayer({ satellites }: SatelliteLayerProps) {
  const { viewer } = useCesium()

  useEffect(() => {
    if (!viewer || satellites.length === 0) return

    const N = satellites.length
    const satrecs = satellites.map((s) => tleToSatRec(s.tle))
    // Classify each satellite into an inclination band once at mount.
    // SatRec.inclo is radians; convert and clamp to [0, 180].
    const bandIndex = new Uint8Array(N)
    for (let i = 0; i < N; i++) {
      const deg = Math.abs((satrecs[i].inclo * 180) / Math.PI) % 360
      const folded = deg > 180 ? 360 - deg : deg
      bandIndex[i] = bandIndexForInclinationDeg(folded)
    }

    // --- Point collection ------------------------------------------------
    const points_ = new PointPrimitiveCollection()
    viewer.scene.primitives.add(points_)

    const indexByNoradId = new Map<number, number>()
    const points: PointPrimitive[] = []
    const origin = Cartesian3.ZERO

    for (let i = 0; i < N; i++) {
      const sat = satellites[i]
      const id: PointId = { type: 'satellite', noradId: sat.tle.noradId, index: i }
      const p = points_.add({
        position: origin,
        pixelSize: DEFAULT_SIZE,
        color: BAND_COLORS[bandIndex[i]],
        outlineWidth: DEFAULT_OUTLINE_WIDTH,
        scaleByDistance: POINT_SCALE_BY_DISTANCE,
        show: false,
        id,
      }) as PointPrimitive
      points.push(p)
      indexByNoradId.set(sat.tle.noradId, i)
    }

    // --- Sample buffers --------------------------------------------------
    // Flat xyz float64 arrays for both prev and next samples. One alloc.
    // Memory footprint is fixed for the lifetime of the mount: 2 × N × 3 ×
    // 8 bytes. For N=10,000 that's ~480 KB — constant, no accumulation.
    const prev = new Float64Array(N * 3)
    const next = new Float64Array(N * 3)
    const valid = new Uint8Array(N) // 1 if this sat is propagating OK
    let prevSampleMs = performance.now()
    let nextSampleMs = prevSampleMs + TICK_MS

    function propagateInto(buf: Float64Array, date: Date) {
      for (let i = 0; i < N; i++) {
        const pos = propagateToGeodetic(satrecs[i], date)
        if (!pos) {
          buf[i * 3] = INVALID_SAMPLE
          valid[i] = 0
          continue
        }
        const c = Cartesian3.fromDegrees(
          pos.longitude,
          pos.latitude,
          pos.height,
        )
        buf[i * 3] = c.x
        buf[i * 3 + 1] = c.y
        buf[i * 3 + 2] = c.z
        valid[i] = 1
      }
    }

    /** Reseed both sample buffers from `performance.now()` — used on mount
     *  and whenever we suspect the clocks have drifted (tab returning from
     *  background). `prev` gets the current wall-clock position; `next`
     *  gets the position TICK_MS in the future; alpha resets to 0. */
    const reseedSamples = () => {
      const t0 = performance.now()
      const d0 = new Date()
      propagateInto(prev, d0)
      propagateInto(next, new Date(d0.getTime() + TICK_MS))
      prevSampleMs = t0
      nextSampleMs = t0 + TICK_MS
    }

    reseedSamples()
    for (let i = 0; i < N; i++) if (valid[i]) points[i].show = true

    // --- 1 Hz propagation ticker ----------------------------------------
    // Anchoring prevSampleMs to the actual performance.now() at tick time
    // (not nextSampleMs + TICK_MS) prevents drift between our interpolation
    // clock and the wall clock we propagate against. Over tens of minutes
    // setInterval jitter would otherwise accumulate enough error to pin
    // alpha at 1 every frame — satellites look frozen between ticks and
    // jump once per second. That was the "progressive choppiness" bug.
    let lastTickCost = 0
    const tick = () => {
      const tickNow = performance.now()
      prev.set(next)
      prevSampleMs = tickNow
      nextSampleMs = tickNow + TICK_MS
      propagateInto(next, new Date(Date.now() + TICK_MS))
      for (let i = 0; i < N; i++) {
        if (valid[i] && !points[i].show) points[i].show = true
        else if (!valid[i] && points[i].show) points[i].show = false
      }
      lastTickCost = performance.now() - tickNow
    }
    const intervalId = window.setInterval(tick, TICK_MS)

    // When the tab comes back from a long background throttle, setInterval
    // may have skipped many firings. Rather than rely on the next tick to
    // catch up (it only advances by TICK_MS), hard-reseed both samples.
    const onVisibility = () => {
      if (document.visibilityState === 'visible') reseedSamples()
    }
    document.addEventListener('visibilitychange', onVisibility)

    // --- Dev-only telemetry ---------------------------------------------
    // Once per minute log a compact health line. Sample count is fixed at
    // 2*N by construction; if this number ever grows, someone reintroduced
    // a SampledPositionProperty or forgot to cap a growing array.
    const telemetryId = import.meta.env.DEV
      ? window.setInterval(() => {
          let validCount = 0
          for (let i = 0; i < N; i++) if (valid[i]) validCount++
          const bytes = prev.byteLength + next.byteLength + valid.byteLength
          console.log(
            `[SatelliteLayer] sats=${validCount}/${N} samples=${2 * N}` +
              ` buffers=${(bytes / 1024).toFixed(0)}KB` +
              ` lastTick=${lastTickCost.toFixed(1)}ms`,
          )
        }, 60_000)
      : 0

    // --- Per-frame lerp pump --------------------------------------------
    const scratch = new Cartesian3()
    let rafId = 0

    const renderFrame = () => {
      const t = performance.now()
      const span = nextSampleMs - prevSampleMs || TICK_MS
      let alpha = (t - prevSampleMs) / span
      if (alpha < 0) alpha = 0
      else if (alpha > 1) alpha = 1
      const inv = 1 - alpha
      for (let i = 0; i < N; i++) {
        if (!valid[i]) continue
        const bx = i * 3
        scratch.x = prev[bx] * inv + next[bx] * alpha
        scratch.y = prev[bx + 1] * inv + next[bx + 1] * alpha
        scratch.z = prev[bx + 2] * inv + next[bx + 2] * alpha
        points[i].position = scratch
      }
      viewer.scene.requestRender()
      rafId = requestAnimationFrame(renderFrame)
    }
    rafId = requestAnimationFrame(renderFrame)

    // --- Click picking ---------------------------------------------------
    const handler = new ScreenSpaceEventHandler(viewer.canvas)
    handler.setInputAction((event: ScreenSpaceEventHandler.PositionedEvent) => {
      const picked = viewer.scene.pick(event.position)
      const id = picked?.id as PointId | undefined
      if (id && id.type === 'satellite') {
        useSelectionStore.getState().select(id.noradId)
      } else {
        useSelectionStore.getState().clear()
      }
    }, ScreenSpaceEventType.LEFT_CLICK)

    // --- Orbit polyline (Entity layer, one polyline) --------------------
    let currentOrbit: Entity | null = null

    const clearOrbit = () => {
      if (currentOrbit) {
        viewer.entities.remove(currentOrbit)
        currentOrbit = null
      }
    }

    const drawOrbit = (idx: number) => {
      clearOrbit()
      const sat = satellites[idx]
      const meta = tleMetadata(sat.tle)
      const period = meta.periodMinutes
      if (!Number.isFinite(period) || period <= 0) return
      const xyz = sampleOrbitEcef(satrecs[idx], new Date(), period, ORBIT_SAMPLES)
      if (!xyz) return
      const positions: Cartesian3[] = []
      for (let i = 0; i < xyz.length; i += 3) {
        positions.push(new Cartesian3(xyz[i], xyz[i + 1], xyz[i + 2]))
      }
      // Close the loop so there's no visible gap at the seam.
      positions.push(positions[0])
      currentOrbit = viewer.entities.add({
        polyline: {
          positions,
          width: 1.5,
          // Orbit color matches the satellite's inclination band, slightly
          // brighter than the point itself so it reads as "related, active".
          material: BAND_ORBIT_COLORS[bandIndex[idx]],
          // Straight 3D segments between our ECEF samples (not geodesic
          // great-circles on the surface) — this is the actual orbit shape.
          arcType: ArcType.NONE,
        },
      })
    }

    // --- Selection sync -------------------------------------------------
    let currentHighlight: number | null = null
    let ghostEntity: Entity | null = null

    const tearDownGhost = () => {
      if (!ghostEntity) return
      if (viewer.trackedEntity === ghostEntity) {
        viewer.trackedEntity = undefined
      }
      viewer.entities.remove(ghostEntity)
      ghostEntity = null
    }

    const applySelection = (noradId: number | null) => {
      if (currentHighlight != null && points[currentHighlight]) {
        const prevP = points[currentHighlight]
        // Restore the previous satellite's inclination-band color.
        prevP.color = BAND_COLORS[bandIndex[currentHighlight]]
        prevP.pixelSize = DEFAULT_SIZE
        prevP.outlineWidth = DEFAULT_OUTLINE_WIDTH
      }

      if (noradId == null) {
        currentHighlight = null
        tearDownGhost()
        clearOrbit()
        viewer.camera.flyHome(HOME_FLY_SECONDS)
        return
      }

      const idx = indexByNoradId.get(noradId)
      if (idx == null) {
        currentHighlight = null
        tearDownGhost()
        clearOrbit()
        return
      }

      const p = points[idx]
      p.color = SELECTED_COLOR
      p.pixelSize = SELECTED_SIZE
      p.outlineColor = SELECTED_OUTLINE
      p.outlineWidth = SELECTED_OUTLINE_WIDTH
      currentHighlight = idx

      tearDownGhost()
      const satrec = satrecs[idx]
      const trackScratch = new Cartesian3()
      const positionProperty = new CallbackPositionProperty(
        (_time, result) => {
          const pos = propagateToGeodetic(satrec, new Date())
          if (!pos) return undefined
          return Cartesian3.fromDegrees(
            pos.longitude,
            pos.latitude,
            pos.height,
            undefined,
            result ?? trackScratch,
          )
        },
        false,
        ReferenceFrame.FIXED,
      )

      ghostEntity = viewer.entities.add({
        position: positionProperty,
        viewFrom: TRACK_VIEW_FROM,
      })
      viewer.trackedEntity = ghostEntity

      // Orbit line last — independent of tracking.
      void drawOrbit(idx)
    }

    applySelection(useSelectionStore.getState().selectedNoradId)
    const unsubscribe = useSelectionStore.subscribe((state, prevState) => {
      if (state.selectedNoradId !== prevState.selectedNoradId) {
        applySelection(state.selectedNoradId)
      }
    })

    return () => {
      cancelAnimationFrame(rafId)
      window.clearInterval(intervalId)
      if (telemetryId) window.clearInterval(telemetryId)
      document.removeEventListener('visibilitychange', onVisibility)
      unsubscribe()
      handler.destroy()
      tearDownGhost()
      clearOrbit()
      if (!viewer.isDestroyed()) {
        viewer.scene.primitives.remove(points_)
      }
    }
  }, [viewer, satellites])

  return null
}

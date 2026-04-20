/**
 * Renders the full active satellite catalog as a single
 * PointPrimitiveCollection — orders of magnitude cheaper than one Entity
 * per satellite. Runs entirely outside React's render cycle after mount.
 *
 * Responsibilities:
 *   - Parse every TLE into a SatRec once (cached for the lifetime of the
 *     catalog array).
 *   - Propagate all satrecs once per second, updating point positions in
 *     place, then trigger a single Cesium requestRender.
 *   - Handle left-click picks → selection store.
 *   - Subscribe to the selection store and update the highlighted point's
 *     color/size imperatively (no React re-renders per selection change
 *     from the point-rendering standpoint).
 *   - When a satellite is selected, attach a position-only "ghost" Entity
 *     to viewer.trackedEntity so camera zoom/orbit is relative to the
 *     moving satellite. On deselect, release the track and fly home.
 *
 * TODO(full-catalog): Frustum-cull or stride propagation if 10k+/1Hz ever
 *   becomes a bottleneck. Current budget on modern hardware is ~20-50ms.
 * TODO(server-side-propagation): Move SGP4 to a worker or backend for
 *   larger catalogs.
 */

import { useEffect } from 'react'
import { useCesium } from 'resium'
import {
  CallbackPositionProperty,
  Cartesian3,
  Color,
  Entity,
  PointPrimitiveCollection,
  ReferenceFrame,
  ScreenSpaceEventHandler,
  ScreenSpaceEventType,
  type PointPrimitive,
} from 'cesium'
import type { Satellite } from '../types/satellite'
import { tleToSatRec, propagateToGeodetic } from '../lib/propagator'
import { useSelectionStore } from '../stores/selection'

const TICK_MS = 1000

const DEFAULT_COLOR = Color.WHITE.withAlpha(0.8)
const SELECTED_COLOR = Color.fromCssColorString('#00d4ff')
const DEFAULT_SIZE = 2
const SELECTED_SIZE = 10

// Hints Cesium where to place the camera when it starts tracking our ghost
// entity. ~2500 km offset gives a reasonable framing around LEO targets.
const TRACK_VIEW_FROM = new Cartesian3(0, -3_000_000, 1_500_000)
const HOME_FLY_SECONDS = 1.0

/** Marker shape we stash in `primitive.id` so pick-handler can look sats up. */
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

    // --- Build satrecs ---------------------------------------------------
    const satrecs = satellites.map((s) => tleToSatRec(s.tle))

    // --- Create the point collection -------------------------------------
    const collection = new PointPrimitiveCollection()
    viewer.scene.primitives.add(collection)

    const indexByNoradId = new Map<number, number>()
    const points: PointPrimitive[] = []
    const origin = Cartesian3.ZERO

    for (let i = 0; i < satellites.length; i++) {
      const sat = satellites[i]
      const id: PointId = { type: 'satellite', noradId: sat.tle.noradId, index: i }
      const p = collection.add({
        position: origin,
        pixelSize: DEFAULT_SIZE,
        color: DEFAULT_COLOR,
        // Default depth test applies — satellites on Earth's far side are
        // occluded by the globe, as physically expected.
        show: false, // hide until first successful propagation
        id,
      }) as PointPrimitive
      points.push(p)
      indexByNoradId.set(sat.tle.noradId, i)
    }

    // --- 1 Hz propagation loop ------------------------------------------
    const scratch = new Cartesian3()
    const tick = () => {
      const now = new Date()
      for (let i = 0; i < satrecs.length; i++) {
        const pos = propagateToGeodetic(satrecs[i], now)
        const p = points[i]
        if (!pos) {
          p.show = false
          continue
        }
        Cartesian3.fromDegrees(pos.longitude, pos.latitude, pos.height, undefined, scratch)
        p.position = scratch
        p.show = true
      }
      viewer.scene.requestRender()
    }
    tick()
    const intervalId = window.setInterval(tick, TICK_MS)

    // --- Click picking --------------------------------------------------
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

    // --- Selection sync -------------------------------------------------
    let currentHighlight: number | null = null
    let ghostEntity: Entity | null = null

    const tearDownGhost = () => {
      if (!ghostEntity) return
      // Clear tracking first; Cesium won't auto-drop the reference when we
      // remove the entity, and trackedEntity holding a stale handle causes
      // subtle "camera stuck" bugs.
      if (viewer.trackedEntity === ghostEntity) {
        viewer.trackedEntity = undefined
      }
      viewer.entities.remove(ghostEntity)
      ghostEntity = null
    }

    const applySelection = (noradId: number | null) => {
      // Restore previous highlighted point's visuals.
      if (currentHighlight != null && points[currentHighlight]) {
        points[currentHighlight].color = DEFAULT_COLOR
        points[currentHighlight].pixelSize = DEFAULT_SIZE
      }

      // Deselection: release camera tracking and smoothly return home.
      if (noradId == null) {
        currentHighlight = null
        tearDownGhost()
        viewer.camera.flyHome(HOME_FLY_SECONDS)
        return
      }

      const idx = indexByNoradId.get(noradId)
      if (idx == null) {
        currentHighlight = null
        tearDownGhost()
        return
      }

      // Highlight the selected point.
      const p = points[idx]
      p.color = SELECTED_COLOR
      p.pixelSize = SELECTED_SIZE
      currentHighlight = idx

      // Replace any prior ghost and attach a new one tracking this satrec.
      // CallbackPositionProperty is re-evaluated on every render — during
      // user interaction Cesium renders continuously, so the camera follows
      // the satellite smoothly through its orbit.
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
        // Hint for camera framing when Cesium starts tracking.
        viewFrom: TRACK_VIEW_FROM,
      })

      // Setting trackedEntity triggers Cesium's own flyTo + enters tracking
      // mode: user zoom/orbit input is then relative to the satellite.
      viewer.trackedEntity = ghostEntity
    }

    applySelection(useSelectionStore.getState().selectedNoradId)
    const unsubscribe = useSelectionStore.subscribe((state, prev) => {
      if (state.selectedNoradId !== prev.selectedNoradId) {
        applySelection(state.selectedNoradId)
      }
    })

    // --- Cleanup ---------------------------------------------------------
    return () => {
      window.clearInterval(intervalId)
      unsubscribe()
      handler.destroy()
      tearDownGhost()
      if (!viewer.isDestroyed()) {
        viewer.scene.primitives.remove(collection)
      }
    }
  }, [viewer, satellites])

  return null
}

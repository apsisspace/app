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
 *   - Fly the camera to the selected satellite's current position.
 *
 * TODO(full-catalog): Frustum-cull or stride propagation if 10k+/1Hz ever
 *   becomes a bottleneck. Current budget on modern hardware is ~20-50ms.
 * TODO(server-side-propagation): Move SGP4 to a worker or backend for
 *   larger catalogs.
 */

import { useEffect } from 'react'
import { useCesium } from 'resium'
import {
  Cartesian3,
  Color,
  PointPrimitiveCollection,
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
    // Invalid TLEs surface as SGP4 error codes during propagate; we keep
    // them in the array so indices stay aligned with `satellites`.
    const satrecs = satellites.map((s) => tleToSatRec(s.tle))

    // --- Create the point collection -------------------------------------
    const collection = new PointPrimitiveCollection()
    viewer.scene.primitives.add(collection)

    // Index lookup: noradId → primitive index. Built once; cheap O(1) picks.
    const indexByNoradId = new Map<number, number>()
    const points: PointPrimitive[] = []
    const origin = Cartesian3.ZERO // initial placeholder; first tick fills it

    for (let i = 0; i < satellites.length; i++) {
      const sat = satellites[i]
      const id: PointId = { type: 'satellite', noradId: sat.tle.noradId, index: i }
      const p = collection.add({
        position: origin,
        pixelSize: DEFAULT_SIZE,
        color: DEFAULT_COLOR,
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
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
    // Track which index is currently "selected" in Cesium-land so we can
    // restore its appearance when selection moves away.
    let currentHighlight: number | null = null
    const applySelection = (noradId: number | null) => {
      // Restore previous.
      if (currentHighlight != null && points[currentHighlight]) {
        points[currentHighlight].color = DEFAULT_COLOR
        points[currentHighlight].pixelSize = DEFAULT_SIZE
      }
      if (noradId == null) {
        currentHighlight = null
        viewer.scene.requestRender()
        return
      }
      const idx = indexByNoradId.get(noradId)
      if (idx == null) {
        currentHighlight = null
        viewer.scene.requestRender()
        return
      }
      const p = points[idx]
      p.color = SELECTED_COLOR
      p.pixelSize = SELECTED_SIZE
      currentHighlight = idx

      // Fly the camera to the satellite's current position. Using the raw
      // geodetic position + a fixed offset is more predictable than
      // flyTo(entity) for a moving target.
      const pos = propagateToGeodetic(satrecs[idx], new Date())
      if (pos) {
        viewer.camera.flyTo({
          destination: Cartesian3.fromDegrees(
            pos.longitude,
            pos.latitude,
            Math.max(pos.height * 3, 2_000_000),
          ),
          duration: 1.2,
        })
      }
      viewer.scene.requestRender()
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
      if (!viewer.isDestroyed()) {
        viewer.scene.primitives.remove(collection)
      }
    }
  }, [viewer, satellites])

  return null
}

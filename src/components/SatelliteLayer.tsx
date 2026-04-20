/**
 * Renders a list of satellites as points on the globe, updating their
 * positions via client-side SGP4 propagation.
 *
 * The Viewer runs in requestRenderMode (see Globe.tsx), so Cesium only
 * redraws on camera input or an explicit requestRender() call. We use
 * CallbackPositionProperty for positions and trigger a render every
 * TICK_MS so the position is recomputed and redrawn. Idle GPU usage is
 * effectively zero.
 *
 * TODO(full-catalog): For thousands of satellites, move to a single
 *   PointPrimitiveCollection and update buffers directly — React/Entity
 *   overhead is fine for tens, not thousands.
 */

import { useEffect, useMemo } from 'react'
import { Entity, PointGraphics, LabelGraphics, useCesium } from 'resium'
import {
  Cartesian3,
  CallbackPositionProperty,
  Color,
  LabelStyle,
  Cartesian2,
  VerticalOrigin,
  ReferenceFrame,
} from 'cesium'
import type { Satellite } from '../types/satellite'
import { tleToSatRec, propagateToGeodetic } from '../lib/propagator'

/** Satellite render cadence, in ms. 1 Hz matches the task spec; higher
 *  values look smoother but cost more GPU. ISS ground track moves ~1° of
 *  longitude per second, so 1 Hz produces visible but orderly steps. */
const TICK_MS = 1000

interface SatelliteLayerProps {
  satellites: Satellite[]
}

export function SatelliteLayer({ satellites }: SatelliteLayerProps) {
  const { viewer } = useCesium()

  // Drive Cesium's explicit render loop at TICK_MS. The CallbackPosition-
  // Property is evaluated during render, so this also advances positions.
  useEffect(() => {
    if (!viewer || satellites.length === 0) return
    const id = window.setInterval(() => {
      viewer.scene.requestRender()
    }, TICK_MS)
    return () => window.clearInterval(id)
  }, [viewer, satellites.length])

  // Parse TLEs once per satellite. When TLE identity changes (e.g. refetch),
  // useMemo produces a fresh SatRec.
  const entries = useMemo(
    () =>
      satellites.map((sat) => ({
        sat,
        satrec: tleToSatRec(sat.tle),
      })),
    [satellites],
  )

  return (
    <>
      {entries.map(({ sat, satrec }) => {
        const positionProperty = new CallbackPositionProperty((_time, result) => {
          const pos = propagateToGeodetic(satrec, new Date())
          if (!pos) return undefined
          return Cartesian3.fromDegrees(
            pos.longitude,
            pos.latitude,
            pos.height,
            undefined,
            result,
          )
        }, false, ReferenceFrame.FIXED)

        const color = Color.fromCssColorString(sat.color ?? '#ff3366')

        return (
          <Entity
            key={sat.tle.noradId}
            name={sat.tle.name}
            position={positionProperty}
          >
            <PointGraphics
              pixelSize={10}
              color={color}
              outlineColor={Color.WHITE}
              outlineWidth={2}
            />
            <LabelGraphics
              text={sat.tle.name}
              font="14px sans-serif"
              fillColor={Color.WHITE}
              outlineColor={Color.BLACK}
              outlineWidth={2}
              style={LabelStyle.FILL_AND_OUTLINE}
              pixelOffset={new Cartesian2(0, -18)}
              verticalOrigin={VerticalOrigin.BOTTOM}
            />
          </Entity>
        )
      })}
    </>
  )
}

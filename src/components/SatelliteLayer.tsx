/**
 * Renders a list of satellites as points on the globe, updating their
 * positions every frame via client-side SGP4 propagation.
 *
 * Uses Cesium's CallbackPositionProperty so Cesium itself drives the
 * animation — no React re-renders per tick.
 *
 * TODO(full-catalog): For thousands of satellites, move to a single
 *   PointPrimitiveCollection and update buffers directly — React/Entity
 *   overhead is fine for tens, not thousands.
 */

import { useMemo } from 'react'
import { Entity, PointGraphics, LabelGraphics } from 'resium'
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

interface SatelliteLayerProps {
  satellites: Satellite[]
}

export function SatelliteLayer({ satellites }: SatelliteLayerProps) {
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

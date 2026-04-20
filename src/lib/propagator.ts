/**
 * Thin wrapper around satellite.js for SGP4 propagation.
 *
 * Client-side propagation scales well for small catalogs (hundreds of sats at
 * 1 Hz). Beyond that we'd push this to a server or a Web Worker.
 *
 * TODO(server-side-propagation): For v2, move propagation to backend for
 * larger catalogs and share a single computed frame across all clients.
 */

import {
  twoline2satrec,
  propagate,
  gstime,
  eciToEcf,
  eciToGeodetic,
  type EciVec3,
  type SatRec,
} from 'satellite.js'
import type { SatellitePosition, TLE } from '../types/satellite'

const RAD_TO_DEG = 180 / Math.PI

/** Parse a TLE into a SatRec ready for SGP4. Memoize at the caller if hot. */
export function tleToSatRec(tle: TLE): SatRec {
  return twoline2satrec(tle.line1, tle.line2)
}

/**
 * Propagate a SatRec to `date` and return WGS84 geodetic coords.
 * Returns null when SGP4 reports a numerical error (e.g. decayed satellite).
 */
export function propagateToGeodetic(
  satrec: SatRec,
  date: Date,
): SatellitePosition | null {
  const pv = propagate(satrec, date)
  if (!pv || !pv.position || typeof pv.position === 'boolean') {
    return null
  }

  const gmst = gstime(date)
  const geo = eciToGeodetic(pv.position, gmst)

  return {
    longitude: geo.longitude * RAD_TO_DEG,
    latitude: geo.latitude * RAD_TO_DEG,
    // satellite.js returns height in km; Cesium wants meters.
    height: geo.height * 1000,
  }
}

export interface PropagationResult {
  /** Geodetic longitude / latitude (degrees) and height (meters). */
  geodetic: SatellitePosition
  /** Speed in km/s (magnitude of the ECI velocity vector). */
  speedKmS: number
  /** ECI position in km — handy for visibility checks. */
  eci: EciVec3<number>
}

/** One call, geodetic + velocity. Returns null on SGP4 error. */
export function propagateFull(
  satrec: SatRec,
  date: Date,
): PropagationResult | null {
  const pv = propagate(satrec, date)
  if (
    !pv ||
    !pv.position ||
    typeof pv.position === 'boolean' ||
    !pv.velocity ||
    typeof pv.velocity === 'boolean'
  ) {
    return null
  }
  const gmst = gstime(date)
  const geo = eciToGeodetic(pv.position, gmst)
  const v = pv.velocity
  const speedKmS = Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z)
  return {
    geodetic: {
      longitude: geo.longitude * RAD_TO_DEG,
      latitude: geo.latitude * RAD_TO_DEG,
      height: geo.height * 1000,
    },
    speedKmS,
    eci: pv.position,
  }
}

/**
 * Sample one full orbital period into ECEF points suitable for a Cesium
 * Polyline. Positions are returned as raw xyz arrays (meters) so the caller
 * can feed `Cartesian3.fromArray`.
 *
 * We compute all samples in ECI, then apply the ECI→ECEF rotation **at a
 * single reference time** — so the orbit visualization appears fixed in
 * Earth's rotating frame at that instant (standard tracker convention).
 */
export function sampleOrbitEcef(
  satrec: SatRec,
  referenceDate: Date,
  periodMinutes: number,
  samples: number,
): Float64Array | null {
  if (!Number.isFinite(periodMinutes) || periodMinutes <= 0) return null
  const out = new Float64Array(samples * 3)
  const gmstRef = gstime(referenceDate)
  const dtMs = (periodMinutes * 60 * 1000) / samples
  const refMs = referenceDate.getTime()
  let wrote = 0
  for (let i = 0; i < samples; i++) {
    const t = new Date(refMs + i * dtMs)
    const pv = propagate(satrec, t)
    if (!pv || !pv.position || typeof pv.position === 'boolean') continue
    const ecef = eciToEcf(pv.position, gmstRef)
    out[wrote * 3 + 0] = ecef.x * 1000
    out[wrote * 3 + 1] = ecef.y * 1000
    out[wrote * 3 + 2] = ecef.z * 1000
    wrote++
  }
  if (wrote < 4) return null
  return wrote === samples ? out : out.slice(0, wrote * 3)
}

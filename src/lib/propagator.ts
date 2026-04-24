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

/** WGS84 equatorial radius (km). Matches satellite.js constants.earthRadius. */
export const EARTH_RADIUS_KM = 6378.137

/** Earth gravitational parameter (μ = GM), km³/s². */
const EARTH_MU_KM3_S2 = 398600.5

/**
 * Semi-major axis in km, computed directly from the TLE mean motion via
 * n² a³ = μ. satellite.js sets an internal `satrec.a` in Earth radii but
 * its TypeScript types don't expose it, so we recompute.
 *
 * `satrec.no` is mean motion in radians per minute; convert to rad/s by
 * dividing by 60 before applying Kepler's third law.
 */
export function semiMajorAxisKm(satrec: SatRec): number {
  const nRadPerSec = satrec.no / 60
  if (!Number.isFinite(nRadPerSec) || nRadPerSec <= 0) return NaN
  return Math.cbrt(EARTH_MU_KM3_S2 / (nRadPerSec * nRadPerSec))
}

/**
 * Apogee altitude above Earth's mean radius, in km.
 *
 * r_apogee = a · (1 + e), subtract one Earth radius to get altitude.
 * Used by callers that want to skip visualizing the orbit for deep-space
 * objects whose TLE-based propagation is known-unreliable.
 */
export function apogeeAltitudeKm(satrec: SatRec): number {
  const a = semiMajorAxisKm(satrec)
  if (!Number.isFinite(a)) return NaN
  return a * (1 + satrec.ecco) - EARTH_RADIUS_KM
}

/**
 * True if this satellite's orbit is too extreme for reliable TLE-based
 * visualization. We suppress the orbit polyline in that case.
 *
 * Threshold picked at 50,000 km apogee — comfortably above every standard
 * GEO/MEO constellation but below the obvious deep-space cases (MMS,
 * TESS, Chandra, IBEX, etc.) where TLE accuracy degrades a lot.
 */
export function isOrbitUnreliable(satrec: SatRec): boolean {
  const apo = apogeeAltitudeKm(satrec)
  return !Number.isFinite(apo) || apo > 50_000
}

export interface OrbitSamplingResult {
  /** Flat xyz array in meters, in ECEF. */
  xyz: Float64Array
  /** True if the number of successful propagations is suspiciously low —
   *  callers can suppress the orbit line to avoid showing a broken path. */
  degraded: boolean
}

/**
 * Sample one full orbital period into ECEF points suitable for a Cesium
 * Polyline. Positions are returned in a flat xyz array (meters).
 *
 * Sampling is uniform in **eccentric anomaly** E, not in time. For a
 * circular orbit (e≈0) this is equivalent to uniform time sampling. For
 * eccentric orbits, Kepler's equation `M = E − e·sin E` means equal
 * steps in E map to compressed time steps near perigee — which is
 * exactly where the satellite is moving fastest and needs the most
 * samples. Uniform-in-time sampling catastrophically undercovers
 * perigee for orbits like MMS (e≈0.8) and makes the polyline appear as
 * a jagged wedge instead of an ellipse.
 *
 * We compute all samples in ECI, then apply the ECI→ECEF rotation at a
 * single reference time so the orbit visualization appears fixed in
 * Earth's rotating frame at that instant (standard tracker convention).
 *
 * Returns null if propagation fails on enough samples that the remaining
 * path is too sparse to draw, OR if the orbit is flagged unreliable.
 */
export function sampleOrbitEcef(
  satrec: SatRec,
  referenceDate: Date,
  periodMinutes: number,
  samples: number,
): Float64Array | null {
  if (!Number.isFinite(periodMinutes) || periodMinutes <= 0) return null
  if (isOrbitUnreliable(satrec)) return null

  const out = new Float64Array(samples * 3)
  const gmstRef = gstime(referenceDate)
  const periodMs = periodMinutes * 60 * 1000
  const refMs = referenceDate.getTime()
  const e = satrec.ecco
  const twoPi = Math.PI * 2

  let wrote = 0
  for (let i = 0; i < samples; i++) {
    // Eccentric anomaly uniformly spaced around [0, 2π). Kepler: M = E -
    // e·sin(E). M / 2π is the fraction of the orbital period, so the
    // corresponding time is refMs + frac·periodMs.
    const E = (twoPi * i) / samples
    const M = E - e * Math.sin(E)
    const frac = M / twoPi
    const t = new Date(refMs + frac * periodMs)

    const pv = propagate(satrec, t)
    if (!pv || !pv.position || typeof pv.position === 'boolean') continue
    const ecef = eciToEcf(pv.position, gmstRef)
    out[wrote * 3 + 0] = ecef.x * 1000
    out[wrote * 3 + 1] = ecef.y * 1000
    out[wrote * 3 + 2] = ecef.z * 1000
    wrote++
  }

  // Require most samples to land. A handful of SGP4 errors is normal for
  // drag-influenced LEO near epoch boundaries; a large fraction failing
  // means the model has given up and the rendered path would mislead.
  if (wrote < Math.max(4, Math.floor(samples * 0.75))) return null
  return wrote === samples ? out : out.slice(0, wrote * 3)
}

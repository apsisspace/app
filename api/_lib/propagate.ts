/**
 * Server-side SGP4 propagation for the tool layer. Pure satellite.js — no
 * Node APIs — so it runs inside Vercel Edge Functions.
 *
 * We re-derive TLE metadata (inclination, period, epoch, COSPAR) locally
 * rather than import the client helper, to keep this module self-contained
 * under the `api/` tsconfig.
 */

import {
  twoline2satrec,
  propagate,
  gstime,
  eciToGeodetic,
} from 'satellite.js'
import type { TLE } from './catalog.js'

const RAD_TO_DEG = 180 / Math.PI
const EARTH_RADIUS_KM = 6371.0088

export interface SatelliteInfo {
  name: string
  noradId: number
  cosparId: string
  inclinationDeg: number
  eccentricity: number
  periodMinutes: number
  apogeeKm: number
  perigeeKm: number
  meanMotionRevPerDay: number
  tleEpochISO: string
  currentAltitudeKm: number
  currentVelocityKmS: number
  currentLatitudeDeg: number
  currentLongitudeDeg: number
  sampledAtISO: string
}

function parseEpoch(line1: string): Date {
  const yr2 = parseInt(line1.substring(18, 20), 10)
  const fullYear = yr2 < 57 ? 2000 + yr2 : 1900 + yr2
  const dayOfYear = parseFloat(line1.substring(20, 32))
  const ms = Date.UTC(fullYear, 0, 1) + (dayOfYear - 1) * 86_400_000
  return new Date(ms)
}

function parseCosparId(line1: string): string {
  return line1.substring(9, 17).trim()
}

function parseEccentricity(line2: string): number {
  // Columns 27-33 (1-indexed), implicit leading decimal.
  const raw = line2.substring(26, 33).trim()
  const n = parseInt(raw, 10)
  if (!Number.isFinite(n)) return NaN
  return n / 1e7
}

/**
 * Semi-major axis (km) from mean motion (rev/day), using Kepler's third law.
 * μ_earth = 398600.4418 km³/s²
 */
function semiMajorAxisKm(meanMotionRevPerDay: number): number {
  const mu = 398600.4418
  const n = (meanMotionRevPerDay * 2 * Math.PI) / 86400 // rad/s
  if (n <= 0) return NaN
  return Math.cbrt(mu / (n * n))
}

/**
 * Compute rich satellite info: catalog fields + derived orbit parameters +
 * live SGP4 snapshot. Returns null if SGP4 reports a numerical error
 * (e.g. heavily decayed satellite).
 */
export function computeSatelliteInfo(tle: TLE, at: Date): SatelliteInfo | null {
  const satrec = twoline2satrec(tle.line1, tle.line2)
  const pv = propagate(satrec, at)
  if (
    !pv ||
    !pv.position ||
    typeof pv.position === 'boolean' ||
    !pv.velocity ||
    typeof pv.velocity === 'boolean'
  ) {
    return null
  }
  const gmst = gstime(at)
  const geo = eciToGeodetic(pv.position, gmst)
  const v = pv.velocity
  const speedKmS = Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z)

  const inclinationDeg = parseFloat(tle.line2.substring(8, 16))
  const meanMotionRevPerDay = parseFloat(tle.line2.substring(52, 63))
  const eccentricity = parseEccentricity(tle.line2)
  const periodMinutes =
    meanMotionRevPerDay > 0 ? 1440 / meanMotionRevPerDay : NaN
  const a = semiMajorAxisKm(meanMotionRevPerDay)
  const apogeeKm = Number.isFinite(a)
    ? a * (1 + eccentricity) - EARTH_RADIUS_KM
    : NaN
  const perigeeKm = Number.isFinite(a)
    ? a * (1 - eccentricity) - EARTH_RADIUS_KM
    : NaN

  return {
    name: tle.name,
    noradId: tle.noradId,
    cosparId: parseCosparId(tle.line1),
    inclinationDeg,
    eccentricity,
    periodMinutes,
    apogeeKm,
    perigeeKm,
    meanMotionRevPerDay,
    tleEpochISO: parseEpoch(tle.line1).toISOString(),
    currentAltitudeKm: geo.height,
    currentVelocityKmS: speedKmS,
    currentLatitudeDeg: geo.latitude * RAD_TO_DEG,
    currentLongitudeDeg: geo.longitude * RAD_TO_DEG,
    sampledAtISO: at.toISOString(),
  }
}

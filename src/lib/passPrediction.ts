/**
 * Pass prediction — "when will this satellite next be visible from here?"
 *
 * A pass is considered "visible" when ALL of:
 *   1. Satellite is above the observer's horizon (elevation > 0°).
 *   2. Observer is in darkness (sun < -6°, civil twilight).
 *   3. Satellite is itself sunlit (not in Earth's shadow).
 *
 * Sun position uses a low-precision (≤0.1°) analytical model — plenty for
 * visibility gating, not for astronomy. Implementation follows the classic
 * Meeus low-precision formulae.
 *
 * Search strategy: step through a 24h window at 30s intervals; the first
 * sample that satisfies all three gates starts a pass, and we keep stepping
 * until elevation drops back below 0° to measure duration + peak.
 */

import {
  ecfToLookAngles,
  eciToEcf,
  gstime,
  propagate,
  type SatRec,
} from 'satellite.js'

const DEG = Math.PI / 180
const RAD = 180 / Math.PI
const EARTH_RADIUS_KM = 6378.137

export interface Observer {
  /** Latitude in degrees (-90..90). */
  lat: number
  /** Longitude in degrees (-180..180). */
  lon: number
  /** Altitude above WGS84 ellipsoid, in kilometers. Usually 0. */
  heightKm: number
}

export interface PassInfo {
  /** When the satellite first clears the horizon. */
  rise: Date
  /** When it drops back below the horizon. */
  set: Date
  /** Maximum elevation achieved during the pass, in degrees. */
  peakElevationDeg: number
  /** Pass duration in seconds. */
  durationSeconds: number
}

interface SunPos {
  /** Right ascension, radians. */
  ra: number
  /** Declination, radians. */
  dec: number
  /** Distance in km (used for illumination geometry). */
  distanceKm: number
}

/** Low-precision geocentric sun position — good to ~0.1°. */
function sunPosition(date: Date): SunPos {
  // Julian Day at UT.
  const jd = date.getTime() / 86_400_000 + 2440587.5
  const n = jd - 2451545.0
  const L = (280.46 + 0.9856474 * n) * DEG // mean longitude
  const g = (357.528 + 0.9856003 * n) * DEG // mean anomaly
  const lambda =
    L + (1.915 * Math.sin(g) + 0.02 * Math.sin(2 * g)) * DEG // ecliptic longitude
  const epsilon = (23.439 - 0.0000004 * n) * DEG // obliquity
  const ra = Math.atan2(Math.cos(epsilon) * Math.sin(lambda), Math.cos(lambda))
  const dec = Math.asin(Math.sin(epsilon) * Math.sin(lambda))
  // Rough distance in AU (good to ~0.02 AU), → km.
  const r =
    1.00014 -
    0.01671 * Math.cos(g) -
    0.00014 * Math.cos(2 * g)
  return { ra, dec, distanceKm: r * 149_597_870.7 }
}

/** Sun altitude at observer, in degrees. */
function sunAltitudeDeg(observer: Observer, date: Date): number {
  const { ra, dec } = sunPosition(date)
  const gmst = gstime(date) // radians
  const ha = gmst + observer.lon * DEG - ra
  const lat = observer.lat * DEG
  const sinAlt =
    Math.sin(lat) * Math.sin(dec) + Math.cos(lat) * Math.cos(dec) * Math.cos(ha)
  return Math.asin(Math.max(-1, Math.min(1, sinAlt))) * RAD
}

/** Sun position as an ECI unit vector (times distance) — km. */
function sunEci(date: Date): { x: number; y: number; z: number } {
  const { ra, dec, distanceKm } = sunPosition(date)
  const cd = Math.cos(dec)
  return {
    x: distanceKm * cd * Math.cos(ra),
    y: distanceKm * cd * Math.sin(ra),
    z: distanceKm * Math.sin(dec),
  }
}

/** True if a satellite at ECI `sat` (km) is in direct sunlight. */
function isSatelliteIlluminated(
  sat: { x: number; y: number; z: number },
  date: Date,
): boolean {
  const sun = sunEci(date)
  // Cylindrical shadow model: sat is in shadow iff it's on Earth's anti-sun
  // side AND within Earth's cylindrical shadow radius.
  const dot = sat.x * sun.x + sat.y * sun.y + sat.z * sun.z
  if (dot > 0) return true // sun-side of Earth — always sunlit
  // Perpendicular distance from the Earth–sun axis.
  const sunMag = Math.sqrt(sun.x * sun.x + sun.y * sun.y + sun.z * sun.z)
  const proj = dot / sunMag
  const px = sat.x - (sun.x / sunMag) * proj
  const py = sat.y - (sun.y / sunMag) * proj
  const pz = sat.z - (sun.z / sunMag) * proj
  const perp = Math.sqrt(px * px + py * py + pz * pz)
  return perp > EARTH_RADIUS_KM
}

/**
 * Find the next visible pass in the next `windowHours` hours. Returns null
 * if the satellite never rises, or never becomes visible in darkness.
 */
export function findNextVisiblePass(
  satrec: SatRec,
  observer: Observer,
  from: Date,
  windowHours = 24,
  stepSeconds = 30,
): PassInfo | null {
  const observerGd = {
    longitude: observer.lon * DEG,
    latitude: observer.lat * DEG,
    height: observer.heightKm,
  }
  const startMs = from.getTime()
  const endMs = startMs + windowHours * 3600 * 1000
  const stepMs = stepSeconds * 1000

  let inPass = false
  let riseTime = 0
  let peak = 0

  for (let t = startMs; t <= endMs; t += stepMs) {
    const date = new Date(t)
    const pv = propagate(satrec, date)
    if (!pv || !pv.position || typeof pv.position === 'boolean') continue
    const gmst = gstime(date)
    const ecf = eciToEcf(pv.position, gmst)
    const look = ecfToLookAngles(observerGd, ecf)
    const elevationDeg = look.elevation * RAD

    if (!inPass) {
      if (elevationDeg <= 0) continue
      // Only count it as a *visible* pass if darkness + illumination hold.
      if (sunAltitudeDeg(observer, date) >= -6) continue
      if (!isSatelliteIlluminated(pv.position, date)) continue
      inPass = true
      riseTime = t
      peak = elevationDeg
    } else {
      if (elevationDeg > peak) peak = elevationDeg
      if (elevationDeg <= 0) {
        // Pass ended. Return it — first visible pass wins.
        return {
          rise: new Date(riseTime),
          set: date,
          peakElevationDeg: peak,
          durationSeconds: (t - riseTime) / 1000,
        }
      }
    }
  }

  return null
}

/** Classify an orbit by altitude (km). */
export function orbitRegime(altitudeKm: number): string {
  if (!Number.isFinite(altitudeKm) || altitudeKm < 0) return ''
  if (altitudeKm < 2000) return 'LEO'
  if (altitudeKm < 35_586) return 'MEO'
  if (altitudeKm < 35_886) return 'GEO'
  return 'HEO'
}

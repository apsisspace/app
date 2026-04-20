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
  eciToGeodetic,
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

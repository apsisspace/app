/**
 * Thin client for Celestrak's GP (general perturbations) endpoint.
 *
 * v1 only fetches a single satellite by NORAD catalog number. v2 will expand
 * to group queries (active, stations, starlink, etc.) with caching.
 */

import type { TLE } from '../types/satellite'

const CELESTRAK_GP_URL = 'https://celestrak.org/NORAD/elements/gp.php'

/** NORAD catalog ID of the International Space Station. */
export const ISS_NORAD_ID = 25544

/**
 * Parse Celestrak's 3-line TLE text format (name / line1 / line2) into a TLE.
 * Throws if the response doesn't look like a valid TLE block.
 */
export function parseTLEText(text: string): TLE {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0)

  if (lines.length < 3) {
    throw new Error(`Unexpected TLE response: got ${lines.length} lines`)
  }
  const [name, line1, line2] = lines
  if (!line1.startsWith('1 ') || !line2.startsWith('2 ')) {
    throw new Error('TLE line prefixes are malformed')
  }

  // NORAD ID sits at columns 3-7 of line1 (spec: 1-indexed 3-7).
  const noradId = parseInt(line1.substring(2, 7).trim(), 10)
  if (!Number.isFinite(noradId)) {
    throw new Error('Could not parse NORAD ID from TLE line 1')
  }

  return { name, line1, line2, noradId }
}

/** Fetch a single satellite's TLE by its NORAD catalog number. */
export async function fetchTLEByCatalogNumber(catnr: number): Promise<TLE> {
  const url = `${CELESTRAK_GP_URL}?CATNR=${catnr}&FORMAT=TLE`
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`Celestrak request failed: ${res.status} ${res.statusText}`)
  }
  const text = await res.text()

  // Celestrak returns "No GP data found" as a 200 when the ID is invalid.
  if (/no gp data found/i.test(text)) {
    throw new Error(`No TLE found for NORAD ID ${catnr}`)
  }

  return parseTLEText(text)
}

// TODO(full-catalog): Add fetchTLEGroup(group: 'active' | 'stations' | ...)
//   using `?GROUP=${group}&FORMAT=TLE` and parse multiple 3-line blocks.

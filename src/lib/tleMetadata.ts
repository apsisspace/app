/**
 * Derive human-readable metadata from a TLE for the side panel.
 *
 * TLE column layout reference:
 * https://celestrak.org/columns/v04n03/
 */

import type { TLE } from '../types/satellite'

export interface TLEMetadata {
  /** International designator / COSPAR ID, e.g. "98067A" for ISS. */
  cosparId: string
  /** Orbital period in minutes. */
  periodMinutes: number
  /** Orbital inclination in degrees. */
  inclinationDeg: number
  /** Epoch as a JS Date (UTC). */
  epoch: Date
  /** Mean motion in revolutions per day (raw TLE value). */
  meanMotionRevDay: number
}

/** Parse the epoch fields from TLE line 1 (columns 19-32, 1-indexed). */
function parseEpoch(line1: string): Date {
  // Two-digit year at columns 19-20; 00-56 → 2000s, 57-99 → 1900s (per spec).
  const yr2 = parseInt(line1.substring(18, 20), 10)
  const fullYear = yr2 < 57 ? 2000 + yr2 : 1900 + yr2
  const dayOfYear = parseFloat(line1.substring(20, 32))
  // Jan 1 00:00 UTC of that year, plus (dayOfYear - 1) days.
  const ms = Date.UTC(fullYear, 0, 1) + (dayOfYear - 1) * 86_400_000
  return new Date(ms)
}

export function tleMetadata(tle: TLE): TLEMetadata {
  const cosparId = tle.line1.substring(9, 17).trim()
  const inclinationDeg = parseFloat(tle.line2.substring(8, 16))
  const meanMotionRevDay = parseFloat(tle.line2.substring(52, 63))
  const periodMinutes = meanMotionRevDay > 0 ? 1440 / meanMotionRevDay : NaN
  return {
    cosparId,
    inclinationDeg,
    meanMotionRevDay,
    periodMinutes,
    epoch: parseEpoch(tle.line1),
  }
}

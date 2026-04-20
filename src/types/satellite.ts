/**
 * Types for TLE ingest, propagation output, and renderable satellite records.
 *
 * A TLE (Two-Line Element set) actually has three lines when fetched with a
 * name header from Celestrak: name + line1 + line2. We keep all three.
 */

export interface TLE {
  /** Common name, e.g. "ISS (ZARYA)". */
  name: string
  /** NORAD catalog number, parsed out of line1 for convenience. */
  noradId: number
  /** First data line (starts with "1 "). */
  line1: string
  /** Second data line (starts with "2 "). */
  line2: string
}

/** Geodetic position of a satellite at a point in time. */
export interface SatellitePosition {
  /** Degrees, -180..180. */
  longitude: number
  /** Degrees, -90..90. */
  latitude: number
  /** Meters above the WGS84 ellipsoid. */
  height: number
}

/** A satellite ready to display: TLE + any cached presentation data. */
export interface Satellite {
  tle: TLE
  /** Display color hint (hex) — used by the layer. Optional for v1. */
  color?: string
}

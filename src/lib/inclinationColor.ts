/**
 * Inclination color bands — groups satellites by orbital inclination for
 * visual encoding on the globe, the legend, and the side panel.
 *
 * Bands follow standard astrodynamics convention (equatorial → retrograde):
 *   0°–30°   Equatorial   red      (GEO, most comms)
 *   30°–60°  Low          orange   (most LEO comms + Starlink grid)
 *   60°–90°  Medium       yellow   (Molniya-ish, some LEO)
 *   90°–120° High/polar   green    (sun-synchronous imaging, ISS-ish)
 *   120°–180° Retrograde  blue     (a few LEO, retrograde constellations)
 *
 * Numbers are deliberately open at the low end, closed at the high end
 * (e.g. 90°-120° includes 120° exactly).
 */

import { Color } from 'cesium'

export interface InclinationBand {
  /** Index into the band list (0..4). */
  index: number
  /** Human label for the legend + side panel badge. */
  name: string
  /** Range [min, max] in degrees. */
  range: [number, number]
  /** Hex color (matches what the legend + points + orbit render with). */
  hex: string
}

export const INCLINATION_BANDS: readonly InclinationBand[] = [
  { index: 0, name: 'Equatorial', range: [0, 30], hex: '#ff4444' },
  { index: 1, name: 'Low', range: [30, 60], hex: '#ff9944' },
  { index: 2, name: 'Medium', range: [60, 90], hex: '#ffdd44' },
  { index: 3, name: 'High', range: [90, 120], hex: '#44ff44' },
  { index: 4, name: 'Retrograde', range: [120, 180], hex: '#4488ff' },
] as const

/** Classify a given inclination (degrees) into a band index [0..4]. */
export function bandIndexForInclinationDeg(deg: number): number {
  if (!Number.isFinite(deg)) return 0
  // Clamp: degenerate TLEs sometimes report >180 or negative. Treat as 0.
  if (deg < 0) return 0
  if (deg < 30) return 0
  if (deg < 60) return 1
  if (deg < 90) return 2
  if (deg < 120) return 3
  return 4
}

export function bandForInclinationDeg(deg: number): InclinationBand {
  return INCLINATION_BANDS[bandIndexForInclinationDeg(deg)]
}

// Pre-built Cesium Color objects to avoid per-frame allocations.
export const BAND_COLORS: readonly Color[] = INCLINATION_BANDS.map((b) =>
  Color.fromCssColorString(b.hex).withAlpha(0.85),
)

/** A brighter variant used by the orbit polyline to stand out over Earth. */
export const BAND_ORBIT_COLORS: readonly Color[] = INCLINATION_BANDS.map((b) =>
  Color.fromCssColorString(b.hex).brighten(0.15, new Color()).withAlpha(0.85),
)

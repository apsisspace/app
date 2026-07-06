/**
 * Client-side analytics over the live catalog for the "State of Orbit" page.
 *
 * Everything here is derived straight from the TLE — no SGP4 propagation — so
 * a full ~10k-object pass is a few milliseconds. Mean altitude comes from the
 * mean motion via Kepler's third law (n² a³ = μ); it's the circular-orbit
 * altitude and is plenty for bucketing a satellite into a regime or histogram.
 */

import type { Satellite } from '../types/satellite'
import { tleMetadata } from './tleMetadata'
import { orbitRegime } from './passPrediction'
import { INCLINATION_BANDS, bandIndexForInclinationDeg } from './inclinationColor'
import { SAT_GROUPS, matchesGroup } from './groups'

const EARTH_RADIUS_KM = 6378.137
const EARTH_MU_KM3_S2 = 398600.4418

export type Regime = 'LEO' | 'MEO' | 'GEO' | 'HEO'
const REGIME_ORDER: Regime[] = ['LEO', 'MEO', 'GEO', 'HEO']

const REGIME_LABEL: Record<Regime, string> = {
  LEO: 'Low Earth Orbit',
  MEO: 'Medium Earth Orbit',
  GEO: 'Geostationary',
  HEO: 'High / other',
}

export interface Count {
  key: string
  label: string
  value: number
  /** Optional bar color (used for the inclination chart). */
  color?: string
}

export interface HistogramBin {
  label: string
  value: number
}

export interface CatalogStats {
  total: number
  /** Objects with a usable mean motion (denominator for altitude-based stats). */
  withAltitude: number
  regimes: Count[]
  inclinationBands: Count[]
  constellations: Count[]
  /** LEO altitude distribution, 200 km bins to 2000 km. */
  leoAltitude: HistogramBin[]
  highlights: {
    leoCount: number
    leoPct: number
    largestConstellation: Count | null
    starlinkPct: number
    medianLeoAltitudeKm: number | null
    fastestPeriodMin: number | null
  }
}

/** Circular-orbit altitude (km) from mean motion (rev/day). NaN if invalid. */
function altitudeFromMeanMotion(meanMotionRevDay: number): number {
  if (!Number.isFinite(meanMotionRevDay) || meanMotionRevDay <= 0) return NaN
  const nRadPerSec = (meanMotionRevDay * 2 * Math.PI) / 86_400
  const a = Math.cbrt(EARTH_MU_KM3_S2 / (nRadPerSec * nRadPerSec))
  return a - EARTH_RADIUS_KM
}

export function computeCatalogStats(catalog: Satellite[]): CatalogStats {
  const total = catalog.length

  const regimeCounts: Record<Regime, number> = { LEO: 0, MEO: 0, GEO: 0, HEO: 0 }
  const bandCounts = INCLINATION_BANDS.map(() => 0)
  const groupCounts = new Map<string, number>()
  for (const g of SAT_GROUPS) groupCounts.set(g.id, 0)

  const LEO_BINS = 10 // 0..2000 km in 200 km steps
  const leoBins = new Array<number>(LEO_BINS).fill(0)
  const leoAltitudes: number[] = []

  let withAltitude = 0
  let starlink = 0
  let fastestPeriod = Infinity

  for (const sat of catalog) {
    const meta = tleMetadata(sat.tle)
    const name = sat.tle.name

    // Inclination band
    const incl = Math.abs(meta.inclinationDeg)
    const folded = incl > 180 ? 360 - incl : incl
    if (Number.isFinite(folded)) bandCounts[bandIndexForInclinationDeg(folded)]++

    // Period (fastest orbit)
    if (Number.isFinite(meta.periodMinutes) && meta.periodMinutes > 0) {
      if (meta.periodMinutes < fastestPeriod) fastestPeriod = meta.periodMinutes
    }

    // Constellation membership
    for (const g of SAT_GROUPS) {
      if (matchesGroup(g, name)) groupCounts.set(g.id, (groupCounts.get(g.id) ?? 0) + 1)
    }
    if (SAT_GROUPS[0] && matchesGroup(SAT_GROUPS[0], name)) starlink++

    // Altitude / regime
    const altKm = altitudeFromMeanMotion(meta.meanMotionRevDay)
    const regime = orbitRegime(altKm) as Regime | ''
    if (regime) {
      withAltitude++
      regimeCounts[regime]++
      if (regime === 'LEO') {
        leoAltitudes.push(altKm)
        const bin = Math.min(LEO_BINS - 1, Math.max(0, Math.floor(altKm / 200)))
        leoBins[bin]++
      }
    }
  }

  const regimes: Count[] = REGIME_ORDER.map((r) => ({
    key: r,
    label: REGIME_LABEL[r],
    value: regimeCounts[r],
  }))

  const inclinationBands: Count[] = INCLINATION_BANDS.map((b, i) => ({
    key: String(b.index),
    label: `${b.name} (${b.range[0]}–${b.range[1]}°)`,
    value: bandCounts[i],
    color: b.hex,
  }))

  const constellations: Count[] = SAT_GROUPS.map((g) => ({
    key: g.id,
    label: g.label,
    value: groupCounts.get(g.id) ?? 0,
  }))
    .filter((c) => c.value > 0)
    .sort((a, b) => b.value - a.value)

  const leoAltitude: HistogramBin[] = leoBins.map((v, i) => ({
    label: `${i * 200}`,
    value: v,
  }))

  // Median LEO altitude
  let medianLeoAltitudeKm: number | null = null
  if (leoAltitudes.length > 0) {
    leoAltitudes.sort((a, b) => a - b)
    const mid = Math.floor(leoAltitudes.length / 2)
    medianLeoAltitudeKm =
      leoAltitudes.length % 2 === 0
        ? (leoAltitudes[mid - 1] + leoAltitudes[mid]) / 2
        : leoAltitudes[mid]
  }

  const leoCount = regimeCounts.LEO
  const largestConstellation = constellations[0] ?? null

  return {
    total,
    withAltitude,
    regimes,
    inclinationBands,
    constellations,
    leoAltitude,
    highlights: {
      leoCount,
      leoPct: total > 0 ? (leoCount / total) * 100 : 0,
      largestConstellation,
      starlinkPct: total > 0 ? (starlink / total) * 100 : 0,
      medianLeoAltitudeKm,
      fastestPeriodMin: Number.isFinite(fastestPeriod) ? fastestPeriod : null,
    },
  }
}

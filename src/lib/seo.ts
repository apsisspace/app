/**
 * Description generators for per-satellite SEO meta tags.
 *
 * Priority:
 *   1. If a curated markdown entry exists in src/data/knowledge/, use its
 *      first sentence (already copy-edited, authoritative).
 *   2. Otherwise synthesize a one-liner from the TLE — regime, inclination,
 *      period, NORAD ID. Useful floor for thousands of satellites for which
 *      we'll never write prose.
 *
 * Output constraints:
 *   - <= 160 chars (Google truncates descriptions around there).
 *   - No HTML, no markdown, no line breaks.
 */

import { KNOWLEDGE } from '../data/knowledge.generated'
import { tleMetadata } from './tleMetadata'
import { orbitRegime } from './passPrediction'
import { propagateToGeodetic, tleToSatRec } from './propagator'
import type { Satellite } from '../types/satellite'

const MAX_LEN = 160

function firstSentence(body: string): string {
  // Collapse whitespace then take up to the first sentence-ending
  // punctuation — handles the typical "Foo is a ... . It does ..." shape
  // of our knowledge entries.
  const flat = body.replace(/\s+/g, ' ').trim()
  const m = flat.match(/^.+?[.!?](?:\s|$)/)
  return (m ? m[0] : flat).trim()
}

function truncate(s: string): string {
  if (s.length <= MAX_LEN) return s
  // Clip at the last space before the limit to avoid splitting a word.
  const slice = s.slice(0, MAX_LEN - 1)
  const lastSpace = slice.lastIndexOf(' ')
  return (lastSpace > 60 ? slice.slice(0, lastSpace) : slice).trim() + '…'
}

export function generateSatelliteDescription(satellite: Satellite): string {
  const noradId = satellite.tle.noradId
  const knowledge = KNOWLEDGE.find((e) => e.noradId === noradId)
  if (knowledge?.body) {
    return truncate(firstSentence(knowledge.body))
  }

  const meta = tleMetadata(satellite.tle)
  // Altitude via a single SGP4 call. Cheap (microseconds) and means we
  // don't have to hand-derive height from mean motion for the description.
  let regime = ''
  try {
    const satrec = tleToSatRec(satellite.tle)
    const pos = propagateToGeodetic(satrec, new Date())
    if (pos) regime = orbitRegime(pos.height / 1000)
  } catch {
    // Bad TLE — fall through to regime-less description.
  }

  const inc = Number.isFinite(meta.inclinationDeg)
    ? `${meta.inclinationDeg.toFixed(1)}°`
    : '—'
  const period = Number.isFinite(meta.periodMinutes)
    ? `${meta.periodMinutes.toFixed(0)} min`
    : '—'
  const regimeText = regime ? `${regime} orbit` : 'orbit'

  return truncate(
    `${satellite.tle.name} is a satellite in ${regimeText} with an inclination of ${inc} and a period of ${period}. NORAD catalog ID ${noradId}.`,
  )
}

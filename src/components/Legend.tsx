/**
 * Bottom-left inclination legend. Collapsed by default (driven by the UI
 * store); the toolbar toggles it. Distribution counts come from the loaded
 * catalog and are computed once per catalog change.
 */

import { useMemo } from 'react'
import type { Satellite } from '../types/satellite'
import {
  INCLINATION_BANDS,
  bandIndexForInclinationDeg,
} from '../lib/inclinationColor'
import { tleMetadata } from '../lib/tleMetadata'
import { useUIStore } from '../stores/ui'

interface LegendProps {
  catalog: Satellite[] | undefined
}

export function Legend({ catalog }: LegendProps) {
  const open = useUIStore((s) => s.legendOpen)

  // Count by band. Recompute only when the catalog reference changes.
  const counts = useMemo<number[]>(() => {
    const out = [0, 0, 0, 0, 0]
    if (!catalog) return out
    for (const sat of catalog) {
      const meta = tleMetadata(sat.tle)
      const deg = Math.abs(meta.inclinationDeg)
      const folded = deg > 180 ? 360 - deg : deg
      out[bandIndexForInclinationDeg(folded)]++
    }
    return out
  }, [catalog])

  if (!open) return null

  const total = counts.reduce((a, b) => a + b, 0)

  return (
    <aside
      className="pointer-events-auto w-56 border border-white/10 bg-[#0a0a0a]/95 p-3 font-mono text-[11px] text-white/80"
      aria-label="Inclination legend"
    >
      <div className="mb-2 text-[10px] uppercase tracking-widest text-white/40">
        Inclination
      </div>
      <ul className="space-y-1">
        {INCLINATION_BANDS.map((band) => (
          <li key={band.index} className="flex items-center gap-2">
            <span
              aria-hidden
              className="inline-block h-2.5 w-2.5 shrink-0"
              style={{ backgroundColor: band.hex }}
            />
            <span className="text-white/85">{band.name}</span>
            <span className="ml-auto text-white/40">
              {band.range[0]}–{band.range[1]}°
            </span>
          </li>
        ))}
      </ul>
      {total > 0 && (
        <div className="mt-3 border-t border-white/10 pt-2 text-[10px] leading-relaxed text-white/50">
          {INCLINATION_BANDS.map((band, i) => (
            <span key={band.index}>
              {counts[i].toLocaleString()} {band.name}
              {i < INCLINATION_BANDS.length - 1 ? ' · ' : ''}
            </span>
          ))}
        </div>
      )}
    </aside>
  )
}

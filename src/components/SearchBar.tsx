/**
 * Minimal search input. Substring-matches satellite names in the catalog
 * and dispatches selection to the Zustand store (which triggers highlight
 * + camera flyTo in SatelliteLayer).
 *
 * Kept dead simple for v2 — no fuzzy matching, no keyboard ↑/↓.
 * Enter picks the first result.
 */

import { useMemo, useState } from 'react'
import type { Satellite } from '../types/satellite'
import { useSelectionActions } from '../hooks/useSelectedSatellite'

const MAX_RESULTS = 10

interface SearchBarProps {
  catalog: Satellite[]
}

export function SearchBar({ catalog }: SearchBarProps) {
  const [query, setQuery] = useState('')
  const { select } = useSelectionActions()

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (q.length < 2) return []
    const matches: Satellite[] = []
    for (const sat of catalog) {
      if (sat.tle.name.toLowerCase().includes(q)) {
        matches.push(sat)
        if (matches.length >= MAX_RESULTS) break
      }
    }
    return matches
  }, [query, catalog])

  const pick = (sat: Satellite) => {
    select(sat.tle.noradId)
    setQuery('')
  }

  return (
    <div className="pointer-events-auto w-80 font-mono text-xs">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && results.length > 0) pick(results[0])
          if (e.key === 'Escape') setQuery('')
        }}
        placeholder="Search satellites..."
        className="w-full rounded-sm border border-white/10 bg-[#0a0a0a]/90 px-3 py-2 text-white placeholder-white/40 outline-none focus:border-[#00d4ff]/60"
        spellCheck={false}
        autoComplete="off"
      />
      {results.length > 0 && (
        <ul className="mt-1 max-h-72 overflow-auto border border-white/10 bg-[#0a0a0a]/95">
          {results.map((sat) => (
            <li key={sat.tle.noradId}>
              <button
                type="button"
                onClick={() => pick(sat)}
                className="block w-full cursor-pointer border-b border-white/5 px-3 py-1.5 text-left text-white/80 last:border-b-0 hover:bg-white/5 hover:text-[#00d4ff]"
              >
                <span className="truncate">{sat.tle.name}</span>
                <span className="float-right ml-2 text-white/40">
                  {sat.tle.noradId}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

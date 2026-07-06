/**
 * Constellation quick-filter chips. A horizontally-scrollable row of pills
 * that isolate a single constellation/mission group on the globe (Starlink,
 * GPS, weather, stations, …). Selecting a chip writes `groupFilter` into the
 * UI store; SatelliteLayer subscribes and toggles point visibility
 * imperatively — the globe never re-renders through React.
 *
 * Groups that match zero satellites in the live catalog are hidden, so a
 * conservative name-matcher that finds nothing simply drops out rather than
 * showing a dead filter. Counts are computed once per catalog.
 */

import { useMemo } from 'react'
import type { Satellite } from '../types/satellite'
import { SAT_GROUPS, matchesGroup } from '../lib/groups'
import { useUIStore } from '../stores/ui'

interface FilterBarProps {
  catalog: Satellite[] | undefined
}

function formatCount(n: number): string {
  if (n >= 1000) {
    const k = n / 1000
    return `${k >= 10 ? Math.round(k) : k.toFixed(1)}k`.replace('.0k', 'k')
  }
  return String(n)
}

export function FilterBar({ catalog }: FilterBarProps) {
  const groupFilter = useUIStore((s) => s.groupFilter)
  const setGroupFilter = useUIStore((s) => s.setGroupFilter)

  // Count members per group once per catalog. ~10k names × ~10 groups is a
  // one-shot ~100k regex tests — negligible and never repeated per render.
  const counts = useMemo(() => {
    const out = new Map<string, number>()
    if (!catalog) return out
    for (const g of SAT_GROUPS) out.set(g.id, 0)
    for (const sat of catalog) {
      const name = sat.tle.name
      for (const g of SAT_GROUPS) {
        if (matchesGroup(g, name)) out.set(g.id, (out.get(g.id) ?? 0) + 1)
      }
    }
    return out
  }, [catalog])

  const visibleGroups = useMemo(
    () => SAT_GROUPS.filter((g) => (counts.get(g.id) ?? 0) > 0),
    [counts],
  )

  if (!catalog || visibleGroups.length === 0) return null

  return (
    <div
      className="pointer-events-auto flex max-w-[92vw] items-center gap-1.5 overflow-x-auto whitespace-nowrap px-0.5 py-0.5 font-mono md:max-w-[min(94vw,960px)] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      role="group"
      aria-label="Filter satellites by constellation"
    >
      <Chip
        label="All"
        active={groupFilter == null}
        onClick={() => setGroupFilter(null)}
        title="Show every satellite"
      />
      {visibleGroups.map((g) => (
        <Chip
          key={g.id}
          label={g.label}
          count={counts.get(g.id)}
          active={groupFilter === g.id}
          onClick={() => setGroupFilter(groupFilter === g.id ? null : g.id)}
          title={`${g.hint} · ${counts.get(g.id)?.toLocaleString()} tracked`}
        />
      ))}
    </div>
  )
}

function Chip({
  label,
  count,
  active,
  onClick,
  title,
}: {
  label: string
  count?: number
  active: boolean
  onClick: () => void
  title: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-pressed={active}
      className={
        'shrink-0 cursor-pointer border px-2.5 py-1 text-[10px] uppercase tracking-widest transition-colors ' +
        (active
          ? 'border-[#00d4ff] bg-[#00d4ff]/15 text-[#00d4ff]'
          : 'border-white/10 bg-[#0a0a0a]/90 text-white/60 hover:border-[#00d4ff]/50 hover:text-[#00d4ff]')
      }
    >
      {label}
      {count != null && (
        <span className={active ? 'ml-1.5 text-[#00d4ff]/70' : 'ml-1.5 text-white/30'}>
          {formatCount(count)}
        </span>
      )}
    </button>
  )
}

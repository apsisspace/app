/**
 * Right-side detail panel for the currently selected satellite.
 * Dark, monospace, teal accents — intentionally minimal.
 */

import type { Satellite } from '../types/satellite'
import { tleMetadata } from '../lib/tleMetadata'
import { useSelectionActions } from '../hooks/useSelectedSatellite'

interface SidePanelProps {
  satellite: Satellite
}

export function SidePanel({ satellite }: SidePanelProps) {
  const { clear } = useSelectionActions()
  const meta = tleMetadata(satellite.tle)

  return (
    <aside
      className="pointer-events-auto flex w-80 flex-col gap-3 border border-white/10 bg-[#0a0a0a]/95 p-4 font-mono text-xs text-white/80"
    >
      <header className="flex items-start justify-between gap-2">
        <h2 className="text-sm font-semibold tracking-wide text-[#00d4ff]">
          {satellite.tle.name}
        </h2>
        <button
          type="button"
          onClick={clear}
          aria-label="Close"
          className="cursor-pointer text-white/50 hover:text-white"
        >
          ×
        </button>
      </header>

      <dl className="grid grid-cols-[7rem_1fr] gap-y-1">
        <Field label="NORAD ID" value={String(satellite.tle.noradId)} />
        <Field label="COSPAR" value={meta.cosparId || '—'} />
        <Field
          label="Period"
          value={
            Number.isFinite(meta.periodMinutes)
              ? `${meta.periodMinutes.toFixed(1)} min`
              : '—'
          }
        />
        <Field
          label="Inclination"
          value={
            Number.isFinite(meta.inclinationDeg)
              ? `${meta.inclinationDeg.toFixed(2)}°`
              : '—'
          }
        />
        <Field label="TLE epoch" value={formatEpoch(meta.epoch)} />
      </dl>
    </aside>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <>
      <dt className="text-white/40 uppercase">{label}</dt>
      <dd className="text-white">{value}</dd>
    </>
  )
}

function formatEpoch(d: Date): string {
  if (!Number.isFinite(d.getTime())) return '—'
  // YYYY-MM-DD HH:MM UTC — compact, unambiguous, mono-friendly.
  const iso = d.toISOString()
  return `${iso.slice(0, 10)} ${iso.slice(11, 16)}Z`
}

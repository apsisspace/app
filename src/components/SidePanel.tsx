/**
 * Right-side detail panel for the currently selected satellite.
 * Dark, monospace, teal accents — intentionally minimal.
 *
 * Live data (altitude, velocity) updates at 1 Hz. Pass prediction runs
 * lazily: only when the user grants geolocation AND a satellite is
 * selected. The search is ~300 ms for 24h × 30s steps — fine to run on the
 * main thread.
 */

import { useEffect, useMemo, useState } from 'react'
import type { Satellite } from '../types/satellite'
import { tleMetadata } from '../lib/tleMetadata'
import {
  tleToSatRec,
  propagateFull,
  isOrbitUnreliable,
} from '../lib/propagator'
import {
  findNextVisiblePass,
  orbitRegime,
  type PassInfo,
} from '../lib/passPrediction'
import { bandForInclinationDeg } from '../lib/inclinationColor'
import type { InclinationBand } from '../lib/inclinationColor'
import { useSelectionActions } from '../hooks/useSelectedSatellite'
import { useObserverStore } from '../stores/observer'
import { useUIStore } from '../stores/ui'

interface SidePanelProps {
  satellite: Satellite
}

export function SidePanel({ satellite }: SidePanelProps) {
  const { clear } = useSelectionActions()
  const meta = tleMetadata(satellite.tle)

  // SatRec is expensive-ish to build; pin it per selection.
  const satrec = useMemo(() => tleToSatRec(satellite.tle), [satellite.tle])

  // --- Live altitude / velocity -----------------------------------------
  const [live, setLive] = useState<{ altKm: number; speedKmS: number } | null>(
    null,
  )
  useEffect(() => {
    let cancelled = false
    const step = () => {
      if (cancelled) return
      const pv = propagateFull(satrec, new Date())
      if (pv) {
        setLive({ altKm: pv.geodetic.height / 1000, speedKmS: pv.speedKmS })
      }
    }
    step()
    const id = window.setInterval(step, 1000)
    return () => {
      cancelled = true
      window.clearInterval(id)
    }
  }, [satrec])

  // --- Pass prediction --------------------------------------------------
  const observerStatus = useObserverStore((s) => s.status)
  const observer = useObserverStore((s) => s.observer)
  const observerErr = useObserverStore((s) => s.errorMessage)
  const requestObserver = useObserverStore((s) => s.request)

  const [pass, setPass] = useState<PassInfo | null>(null)
  const [passState, setPassState] = useState<'idle' | 'computing' | 'done' | 'none'>(
    'idle',
  )

  useEffect(() => {
    // All state updates live inside the async callback so the effect body
    // itself doesn't cause a re-render during the same commit.
    let cancelled = false
    const h = window.setTimeout(() => {
      if (cancelled) return
      if (!observer) {
        setPass(null)
        setPassState('idle')
        return
      }
      setPass(null)
      setPassState('computing')
      // Yield once more so the "computing" paint happens before we block.
      window.setTimeout(() => {
        if (cancelled) return
        const found = findNextVisiblePass(satrec, observer, new Date())
        if (cancelled) return
        setPass(found)
        setPassState(found ? 'done' : 'none')
      }, 0)
    }, 0)
    return () => {
      cancelled = true
      window.clearTimeout(h)
    }
  }, [satrec, observer])

  // --- Derivations ------------------------------------------------------
  const orbitUnreliable = useMemo(() => isOrbitUnreliable(satrec), [satrec])
  const regime = live ? orbitRegime(live.altKm) : ''
  const periodText = Number.isFinite(meta.periodMinutes)
    ? `${meta.periodMinutes.toFixed(0)} min${regime ? ` (${regime})` : ''}`
    : '—'
  const band: InclinationBand | null = Number.isFinite(meta.inclinationDeg)
    ? bandForInclinationDeg(foldInclination(meta.inclinationDeg))
    : null

  const setChatOpen = useUIStore((s) => s.setChatOpen)

  return (
    <aside className="pointer-events-auto flex w-80 flex-col gap-3 border border-white/10 bg-[#0a0a0a]/95 p-4 font-mono text-xs text-white/80">
      <header className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-sm font-semibold tracking-wide text-[#00d4ff]">
            {satellite.tle.name}
          </h2>
          {band && (
            <div className="mt-1 flex items-center gap-1.5">
              <span
                aria-hidden
                className="inline-block h-2 w-2 shrink-0"
                style={{ backgroundColor: band.hex }}
              />
              <span className="text-[10px] uppercase tracking-widest text-white/55">
                {band.name} · {meta.inclinationDeg.toFixed(1)}°
              </span>
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={clear}
          aria-label="Close"
          className="cursor-pointer text-white/50 hover:text-white"
        >
          ×
        </button>
      </header>

      {/* Live stat strip */}
      <div className="grid grid-cols-2 gap-x-3 border border-white/5 bg-white/[0.02] p-2">
        <Stat
          label="Altitude"
          value={live ? `${live.altKm.toFixed(0)} km` : '—'}
          accent
        />
        <Stat
          label="Velocity"
          value={live ? `${live.speedKmS.toFixed(2)} km/s` : '—'}
          accent
        />
      </div>

      <dl className="grid grid-cols-[6.5rem_1fr] gap-y-1">
        <Field label="NORAD ID" value={String(satellite.tle.noradId)} />
        <Field label="COSPAR" value={meta.cosparId || '—'} />
        <Field label="Period" value={periodText} />
        <Field
          label="Inclination"
          value={
            Number.isFinite(meta.inclinationDeg)
              ? `${meta.inclinationDeg.toFixed(2)}°`
              : '—'
          }
        />
      </dl>

      {/* Deep-space advisory. SGP4/SDP4 accuracy degrades rapidly past
          ~50,000 km apogee; we suppress the orbit polyline in that case
          (see isOrbitUnreliable) and say so here so the absence doesn't
          read as a bug. */}
      {orbitUnreliable && (
        <div className="mt-1 border border-amber-500/20 bg-amber-500/5 px-2 py-1.5 text-[11px] text-amber-200/80">
          Orbit visualization unavailable for deep-space objects. Position
          estimates may also drift.
        </div>
      )}

      {/* Next pass */}
      <div className="border-t border-white/10 pt-3">
        <div className="mb-1 text-[10px] uppercase tracking-widest text-white/40">
          Next pass over you
        </div>
        <PassBlock
          status={observerStatus}
          observerErr={observerErr}
          passState={passState}
          pass={pass}
          onRequestLocation={requestObserver}
        />
      </div>

      <div className="mt-2 text-center text-[10px] text-white/40">
        Data from TLE epoch {formatEpoch(meta.epoch)}
      </div>

      <div className="mt-3 border-t border-white/10 pt-3">
        <button
          type="button"
          onClick={() => setChatOpen(true)}
          className="w-full cursor-pointer border border-[#00d4ff]/40 bg-transparent py-2 text-center text-[#00d4ff] hover:border-[#00d4ff] hover:bg-[#00d4ff]/10 uppercase tracking-widest text-xs"
        >
          Ask about {satellite.tle.name}
        </button>
      </div>
    </aside>
  )
}

// ---------- subcomponents --------------------------------------------------

function Field({ label, value }: { label: string; value: string }) {
  return (
    <>
      <dt className="text-white/40 uppercase">{label}</dt>
      <dd className={value === '—' ? 'text-white/40' : 'text-white'}>{value}</dd>
    </>
  )
}

function Stat({
  label,
  value,
  accent = false,
}: {
  label: string
  value: string
  accent?: boolean
}) {
  const isMissing = value === '—'
  return (
    <div className="flex flex-col">
      <span className="text-[10px] uppercase tracking-widest text-white/40">
        {label}
      </span>
      <span
        className={
          isMissing
            ? 'text-sm text-white/40'
            : accent
              ? 'text-sm text-[#00d4ff]'
              : 'text-sm text-white'
        }
      >
        {value}
      </span>
    </div>
  )
}

function PassBlock({
  status,
  observerErr,
  passState,
  pass,
  onRequestLocation,
}: {
  status: ReturnType<typeof useObserverStore.getState>['status']
  observerErr: string | null
  passState: 'idle' | 'computing' | 'done' | 'none'
  pass: PassInfo | null
  onRequestLocation: () => void
}) {
  if (status === 'idle') {
    return (
      <button
        type="button"
        onClick={onRequestLocation}
        className="cursor-pointer border border-[#00d4ff]/40 bg-transparent px-2 py-1 text-left text-[#00d4ff] hover:border-[#00d4ff] hover:bg-[#00d4ff]/10"
      >
        Enable location for pass prediction
      </button>
    )
  }
  if (status === 'requesting') {
    return <div className="text-white/60">Requesting location…</div>
  }
  if (status === 'denied') {
    return (
      <div className="text-white/60">
        Location permission denied. Allow it in your browser to see passes.
      </div>
    )
  }
  if (status === 'unsupported') {
    return (
      <div className="text-white/60">Geolocation isn't available here.</div>
    )
  }
  if (status === 'error') {
    return (
      <div className="text-white/60">
        Couldn't get location{observerErr ? `: ${observerErr}` : '.'}
      </div>
    )
  }

  if (passState === 'computing') {
    return <div className="text-white/60">Computing…</div>
  }
  if (passState === 'none') {
    return (
      <div className="text-white/60">
        No visible pass in the next 24 h.
      </div>
    )
  }
  if (passState === 'done' && pass) {
    return (
      <div className="space-y-0.5">
        <div className="text-white">
          {formatRelative(pass.rise)} —{' '}
          <span className="text-white/60">{formatClock(pass.rise)}</span>
        </div>
        <div className="text-[11px] text-white/50">
          peak {pass.peakElevationDeg.toFixed(0)}° · {Math.round(
            pass.durationSeconds / 60,
          )} min
        </div>
      </div>
    )
  }
  return null
}

// ---------- formatting ----------------------------------------------------

function formatEpoch(d: Date): string {
  if (!Number.isFinite(d.getTime())) return '—'
  const iso = d.toISOString()
  return `${iso.slice(0, 10)} ${iso.slice(11, 16)}Z`
}

function formatClock(d: Date): string {
  // Local wall-clock, HH:MM — ample for "when should I go outside?"
  return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
}

function formatRelative(d: Date): string {
  const deltaMs = d.getTime() - Date.now()
  if (deltaMs < 0) return 'now'
  const mins = Math.round(deltaMs / 60_000)
  if (mins < 60) return `in ${mins} min`
  const hours = Math.round(mins / 60)
  if (hours < 24) return `in ${hours} h`
  return `in ${Math.round(hours / 24)} d`
}

// Some TLEs encode retrograde orbits with inclination > 180°; fold to [0,180]
// so the band classifier sees a canonical value.
function foldInclination(deg: number): number {
  const abs = Math.abs(deg)
  return abs > 180 ? 360 - abs : abs
}

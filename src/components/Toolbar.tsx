/**
 * Bottom-center icon toolbar. Four buttons:
 *   1. Earth mode (cycles minimal → full → night)
 *   2. Legend toggle
 *   3. Time controls (disabled, tooltip only — v-next)
 *   4. Help / about modal
 *
 * Icons are thin SVG line art to match the monospace, low-chroma aesthetic.
 */

import type { ReactNode } from 'react'
import { useUIStore, type EarthMode } from '../stores/ui'

const EARTH_MODE_LABEL: Record<EarthMode, string> = {
  minimal: 'Minimal',
  full: 'Full',
  night: 'Night',
}

export function Toolbar() {
  const earthMode = useUIStore((s) => s.earthMode)
  const cycleEarthMode = useUIStore((s) => s.cycleEarthMode)
  const legendOpen = useUIStore((s) => s.legendOpen)
  const toggleLegend = useUIStore((s) => s.toggleLegend)
  const setHelpOpen = useUIStore((s) => s.setHelpOpen)

  return (
    <div className="pointer-events-auto flex items-center gap-1 border border-white/10 bg-[#0a0a0a]/95 px-1 py-1 font-mono text-[11px] text-white/70">
      <ToolbarButton
        title={`Earth: ${EARTH_MODE_LABEL[earthMode]} — click to cycle`}
        onClick={cycleEarthMode}
      >
        <GlobeIcon />
        <span className="pl-1.5 pr-1 text-[10px] uppercase tracking-widest">
          {EARTH_MODE_LABEL[earthMode]}
        </span>
      </ToolbarButton>

      <Divider />

      <ToolbarButton
        title={legendOpen ? 'Hide legend' : 'Show inclination legend'}
        onClick={toggleLegend}
        active={legendOpen}
      >
        <LegendIcon />
      </ToolbarButton>

      <ToolbarButton
        title="Time controls coming soon"
        onClick={() => {}}
        disabled
      >
        <ClockIcon />
      </ToolbarButton>

      <Divider />

      <ToolbarButton title="About Apsis Space" onClick={() => setHelpOpen(true)}>
        <HelpIcon />
      </ToolbarButton>
    </div>
  )
}

// ---------- primitives -----------------------------------------------------

function ToolbarButton({
  children,
  title,
  onClick,
  active = false,
  disabled = false,
}: {
  children: ReactNode
  title: string
  onClick: () => void
  active?: boolean
  disabled?: boolean
}) {
  const base =
    'flex h-8 items-center px-2 transition-colors outline-none focus-visible:ring-1 focus-visible:ring-[#00d4ff]'
  const stateClass = disabled
    ? 'cursor-not-allowed text-white/25'
    : active
      ? 'cursor-pointer text-[#00d4ff]'
      : 'cursor-pointer text-white/60 hover:text-[#00d4ff]'
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${stateClass}`}
    >
      {children}
    </button>
  )
}

function Divider() {
  return <div aria-hidden className="mx-0.5 h-4 w-px bg-white/10" />
}

// ---------- icons (thin-stroke SVG) ---------------------------------------

const iconCls = 'h-4 w-4'
const strokeProps = {
  fill: 'none' as const,
  stroke: 'currentColor',
  strokeWidth: 1.25,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
}

function GlobeIcon() {
  return (
    <svg viewBox="0 0 16 16" className={iconCls} {...strokeProps}>
      <circle cx="8" cy="8" r="6" />
      <ellipse cx="8" cy="8" rx="6" ry="2.5" />
      <path d="M8 2v12" />
    </svg>
  )
}

function LegendIcon() {
  return (
    <svg viewBox="0 0 16 16" className={iconCls} {...strokeProps}>
      <path d="M3 4h10M3 8h10M3 12h10" />
      <circle cx="2" cy="4" r="0.5" fill="currentColor" />
      <circle cx="2" cy="8" r="0.5" fill="currentColor" />
      <circle cx="2" cy="12" r="0.5" fill="currentColor" />
    </svg>
  )
}

function ClockIcon() {
  return (
    <svg viewBox="0 0 16 16" className={iconCls} {...strokeProps}>
      <circle cx="8" cy="8" r="6" />
      <path d="M8 4.5V8l2.5 1.5" />
    </svg>
  )
}

function HelpIcon() {
  return (
    <svg viewBox="0 0 16 16" className={iconCls} {...strokeProps}>
      <circle cx="8" cy="8" r="6" />
      <path d="M6.3 6.3a1.8 1.8 0 1 1 2.7 1.5c-0.6 0.3-1 0.7-1 1.4" />
      <circle cx="8" cy="11.6" r="0.4" fill="currentColor" stroke="none" />
    </svg>
  )
}

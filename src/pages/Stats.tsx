/**
 * /stats — "State of Orbit". Live, shareable analytics over the active
 * catalog: what's up there, where it orbits, and who owns most of it. All
 * computed client-side from the same TLE set the tracker renders.
 */

import { useMemo } from 'react'
import { Link } from 'wouter'
import { Helmet } from 'react-helmet-async'
import { useSatelliteCatalog } from '../hooks/useSatelliteCatalog'
import { computeCatalogStats, type Count, type HistogramBin } from '../lib/catalogStats'
import { SiteNav, SiteFooter, PageShell } from '../components/SiteChrome'

const CANONICAL = 'https://app.apsisspace.com/stats'
const TITLE = 'State of Orbit — Live Satellite Statistics | Apsis Space'
const DESCRIPTION =
  'Live statistics on every active satellite in orbit: how many there are, the split across LEO/MEO/GEO, inclination distribution, and the biggest constellations.'

export function Stats() {
  const { data: catalog, isPending } = useSatelliteCatalog()
  const stats = useMemo(
    () => (catalog ? computeCatalogStats(catalog) : null),
    [catalog],
  )

  const fmt = (n: number) => n.toLocaleString()

  return (
    <PageShell>
      <Helmet>
        <title>{TITLE}</title>
        <meta name="description" content={DESCRIPTION} />
        <link rel="canonical" href={CANONICAL} />
        <meta property="og:title" content={TITLE} />
        <meta property="og:description" content={DESCRIPTION} />
        <meta property="og:url" content={CANONICAL} />
        <meta property="og:image" content="https://app.apsisspace.com/og-image.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={TITLE} />
        <meta name="twitter:description" content={DESCRIPTION} />
      </Helmet>

      <SiteNav />

      <main className="mx-auto max-w-[900px] px-6 py-12">
        <header className="mb-12 max-w-[640px]">
          <div className="mb-3 font-mono text-[11px] uppercase tracking-[0.3em] text-[#00d4ff]/70">
            State of Orbit
          </div>
          <h1 className="mb-4 text-3xl font-light leading-tight text-white/95 sm:text-4xl">
            A live census of the sky.
          </h1>
          <p className="text-base leading-relaxed text-white/60">
            Every number below is computed right now from the active catalog —
            the same {stats ? fmt(stats.total) : '~10,000'} objects you can
            watch orbiting on the{' '}
            <Link href="/" className="text-[#00d4ff] hover:underline">
              live tracker
            </Link>
            .
          </p>
        </header>

        {isPending && !stats && (
          <div className="py-24 text-center font-mono text-[11px] uppercase tracking-widest text-white/40">
            Loading catalog…
          </div>
        )}

        {stats && (
          <div className="space-y-14">
            {/* Highlight tiles */}
            <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Tile value={fmt(stats.total)} label="Active objects tracked" />
              <Tile
                value={`${stats.highlights.leoPct.toFixed(0)}%`}
                label="Fly in Low Earth Orbit"
              />
              <Tile
                value={`${stats.highlights.starlinkPct.toFixed(0)}%`}
                label="Are Starlink satellites"
              />
              <Tile
                value={
                  stats.highlights.medianLeoAltitudeKm != null
                    ? `${Math.round(stats.highlights.medianLeoAltitudeKm)} km`
                    : '—'
                }
                label="Median LEO altitude"
              />
            </section>

            {/* Orbit regimes */}
            <ChartSection
              title="Where everything orbits"
              note="Circular-orbit altitude derived from each object's mean motion."
            >
              <BarList counts={stats.regimes} />
            </ChartSection>

            {/* Constellations */}
            {stats.constellations.length > 0 && (
              <ChartSection
                title="Biggest constellations"
                note="Grouped by catalog name. Starlink alone dwarfs everything else."
              >
                <BarList counts={stats.constellations} />
              </ChartSection>
            )}

            {/* Inclination bands */}
            <ChartSection
              title="Orbital inclination"
              note="The tilt of each orbit relative to the equator — the same color code as the tracker's legend."
            >
              <BarList counts={stats.inclinationBands} useColor />
            </ChartSection>

            {/* LEO altitude histogram */}
            <ChartSection
              title="How low is Low Earth Orbit, really?"
              note="Altitude distribution of LEO objects, in 200 km bins. The spike near 500–600 km is the Starlink / OneWeb shells."
            >
              <Histogram bins={stats.leoAltitude} unit="km" />
            </ChartSection>

            <p className="border-t border-white/10 pt-6 font-mono text-[10px] uppercase tracking-widest text-white/30">
              Source: Celestrak active catalog · propagated in your browser ·
              figures update as the catalog refreshes
            </p>
          </div>
        )}
      </main>

      <SiteFooter />
    </PageShell>
  )
}

// ---------- chart primitives ----------------------------------------------

function Tile({ value, label }: { value: string; label: string }) {
  return (
    <div className="border border-white/10 bg-white/[0.02] p-4">
      <div className="font-mono text-2xl font-semibold text-[#00d4ff] sm:text-3xl">
        {value}
      </div>
      <div className="mt-1 text-[11px] leading-snug text-white/50">{label}</div>
    </div>
  )
}

function ChartSection({
  title,
  note,
  children,
}: {
  title: string
  note?: string
  children: React.ReactNode
}) {
  return (
    <section>
      <h2 className="mb-1 font-mono text-xs font-semibold uppercase tracking-[0.3em] text-[#00d4ff]/80">
        {title}
      </h2>
      {note && <p className="mb-5 max-w-[560px] text-xs leading-relaxed text-white/45">{note}</p>}
      {children}
    </section>
  )
}

function BarList({ counts, useColor = false }: { counts: Count[]; useColor?: boolean }) {
  const max = Math.max(1, ...counts.map((c) => c.value))
  return (
    <ul className="space-y-2.5">
      {counts.map((c) => {
        const pct = (c.value / max) * 100
        return (
          <li key={c.key} className="flex items-center gap-3">
            <span className="w-40 shrink-0 truncate font-mono text-[11px] text-white/60">
              {c.label}
            </span>
            <span className="relative h-4 flex-1 bg-white/[0.04]">
              <span
                className="absolute inset-y-0 left-0"
                style={{
                  width: `${Math.max(pct, 1.5)}%`,
                  backgroundColor: useColor && c.color ? c.color : '#00d4ff',
                  opacity: useColor ? 0.85 : 0.7,
                }}
              />
            </span>
            <span className="w-16 shrink-0 text-right font-mono text-[11px] tabular-nums text-white/70">
              {c.value.toLocaleString()}
            </span>
          </li>
        )
      })}
    </ul>
  )
}

function Histogram({ bins, unit }: { bins: HistogramBin[]; unit: string }) {
  const max = Math.max(1, ...bins.map((b) => b.value))
  return (
    <div>
      <div className="flex h-44 items-end gap-1.5">
        {bins.map((b, i) => {
          const pct = (b.value / max) * 100
          return (
            <div key={i} className="group flex flex-1 flex-col items-center justify-end">
              <span className="mb-1 font-mono text-[9px] tabular-nums text-white/40 opacity-0 transition-opacity group-hover:opacity-100">
                {b.value.toLocaleString()}
              </span>
              <div
                className="w-full bg-[#00d4ff]/70 transition-colors group-hover:bg-[#00d4ff]"
                style={{ height: `${Math.max(pct, 0.5)}%` }}
                title={`${b.label}–${Number(b.label) + 200} ${unit}: ${b.value.toLocaleString()}`}
              />
            </div>
          )
        })}
      </div>
      <div className="mt-2 flex gap-1.5 font-mono text-[9px] tabular-nums text-white/40">
        {bins.map((b, i) => (
          <span key={i} className="flex-1 text-center">
            {i % 2 === 0 ? b.label : ''}
          </span>
        ))}
      </div>
      <div className="mt-1 text-center font-mono text-[10px] uppercase tracking-widest text-white/30">
        Altitude ({unit})
      </div>
    </div>
  )
}

/**
 * /satellites — curated HTML index page.
 *
 * Exists for SEO: every entry is a real <a href="/satellite/:id"> so search
 * engines crawl into the individual satellite pages without having to
 * interact with the 3D globe. Visually minimal, matches the rest of the
 * app (black, monospace, teal accents).
 */

import { Link } from 'wouter'
import { Helmet } from 'react-helmet-async'
import { useSatelliteCatalog } from '../hooks/useSatelliteCatalog'
import { NOTABLE_SATELLITES } from '../data/notableSatellites'
import { tleMetadata } from '../lib/tleMetadata'
import { orbitRegime } from '../lib/passPrediction'
import { propagateToGeodetic, tleToSatRec } from '../lib/propagator'
import type { Satellite } from '../types/satellite'

interface Row {
  noradId: number
  name: string
  inclinationDeg: number
  periodMinutes: number
  regime: string
}

function buildRow(sat: Satellite): Row {
  const meta = tleMetadata(sat.tle)
  let regime = ''
  try {
    const pos = propagateToGeodetic(tleToSatRec(sat.tle), new Date())
    if (pos) regime = orbitRegime(pos.height / 1000)
  } catch {
    // Bad TLE — leave regime blank; the row still renders.
  }
  return {
    noradId: sat.tle.noradId,
    name: sat.tle.name,
    inclinationDeg: meta.inclinationDeg,
    periodMinutes: meta.periodMinutes,
    regime,
  }
}

export function SatellitesIndexRoute() {
  const { data: catalog, isPending } = useSatelliteCatalog()

  const rows: Row[] = (() => {
    if (!catalog) return []
    const byNorad = new Map(catalog.map((s) => [s.tle.noradId, s]))
    const out: Row[] = []
    for (const seed of NOTABLE_SATELLITES) {
      const sat = byNorad.get(seed.noradId)
      if (sat) out.push(buildRow(sat))
    }
    out.sort((a, b) => a.noradId - b.noradId)
    return out
  })()

  return (
    <div className="min-h-screen bg-black text-white selection:bg-[#00d4ff]/30">
      <Helmet>
        <title>Notable Satellites — Apsis Space</title>
        <meta
          name="description"
          content="A curated list of well-known active satellites. Track any in real-time 3D on Apsis Space."
        />
        <meta
          property="og:title"
          content="Notable Satellites — Apsis Space"
        />
        <meta
          property="og:description"
          content="A curated list of well-known active satellites. Track any in real-time 3D on Apsis Space."
        />
        <meta
          property="og:url"
          content="https://app.apsisspace.com/satellites"
        />
        <link rel="canonical" href="https://app.apsisspace.com/satellites" />
      </Helmet>

      <nav className="mx-auto flex max-w-[900px] items-center justify-between p-4 font-mono text-[11px] uppercase tracking-widest text-white/50">
        <Link href="/" className="hover:text-[#00d4ff] transition-colors">
          &larr; Back to tracker
        </Link>
        <Link href="/about" className="hover:text-[#00d4ff] transition-colors">
          About
        </Link>
      </nav>

      <main className="mx-auto max-w-[900px] px-6 py-8 pb-24 font-mono">
        <header className="mb-10 select-none">
          <h1 className="text-xl font-semibold tracking-[0.3em] uppercase text-[#00d4ff]/80">
            Apsis<span className="text-[#00d4ff]/40"> · </span>Space
          </h1>
        </header>

        <section className="mb-10">
          <h2 className="mb-3 text-2xl font-light tracking-wide text-white/90">
            Notable Satellites
          </h2>
          <p className="max-w-[560px] text-sm text-white/60 leading-relaxed">
            A curated list of well-known objects currently in orbit. Click any
            to view it live on the 3D tracker.
          </p>
        </section>

        {isPending && !catalog && (
          <div className="text-[11px] uppercase tracking-widest text-white/40">
            Loading catalog…
          </div>
        )}

        {catalog && rows.length === 0 && (
          <div className="text-[11px] uppercase tracking-widest text-white/40">
            None of the curated satellites are in the active catalog right now.
          </div>
        )}

        {rows.length > 0 && (
          <ul className="divide-y divide-white/5 border-y border-white/10">
            {rows.map((row) => (
              <li key={row.noradId}>
                <Link
                  href={`/satellite/${row.noradId}`}
                  className="group flex flex-col gap-1 px-2 py-4 text-sm text-white hover:bg-white/[0.03] sm:flex-row sm:items-center sm:justify-between sm:gap-6"
                >
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[#00d4ff] group-hover:underline">
                      {row.name}
                    </div>
                    <div className="mt-0.5 text-[10px] uppercase tracking-widest text-white/40">
                      NORAD {row.noradId}
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-4 text-[11px] text-white/60">
                    <span className="tabular-nums">
                      {Number.isFinite(row.inclinationDeg)
                        ? `${row.inclinationDeg.toFixed(1)}°`
                        : '—'}
                    </span>
                    <span className="tabular-nums">
                      {Number.isFinite(row.periodMinutes)
                        ? `${row.periodMinutes.toFixed(0)} min`
                        : '—'}
                    </span>
                    <span className="w-10 text-left uppercase tracking-widest text-white/40">
                      {row.regime || '—'}
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}

        <footer className="mt-16 border-t border-white/10 pt-8 text-[10px] uppercase tracking-widest text-white/40">
          &copy; {new Date().getFullYear()} Apsis Space
        </footer>
      </main>
    </div>
  )
}

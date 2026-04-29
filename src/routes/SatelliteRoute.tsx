/**
 * /satellite/:norad_id overlay. Renders on top of the always-mounted App/Globe
 * (see GlobeTracker in main.tsx). Responsibilities:
 *   - Sync URL NORAD ID → selection store on mount, clear on unmount.
 *   - Inject dynamic <head> meta for SEO / link previews.
 *   - Show a 404 overlay if the NORAD ID isn't in the catalog.
 *
 * This component deliberately does NOT render <App /> — Globe lives in the
 * parent GlobeTracker and must not be destroyed on route transitions.
 */

import { useEffect, useMemo } from 'react'
import { useParams, Link } from 'wouter'
import { Helmet } from 'react-helmet-async'
import { useSatelliteCatalog } from '../hooks/useSatelliteCatalog'
import { useSelectionStore } from '../stores/selection'
import { generateSatelliteDescription } from '../lib/seo'
import type { Satellite } from '../types/satellite'

interface SatelliteRouteParams {
  norad_id?: string
  [key: string]: string | undefined
}

export function SatelliteRoute() {
  const params = useParams<SatelliteRouteParams>()
  const noradId = params.norad_id != null ? Number(params.norad_id) : NaN
  const { data: catalog } = useSatelliteCatalog()

  const found: Satellite | null = useMemo(() => {
    if (!catalog || !Number.isFinite(noradId)) return null
    return catalog.find((s) => s.tle.noradId === noradId) ?? null
  }, [catalog, noradId])

  useEffect(() => {
    if (!found) return
    const id = found.tle.noradId
    useSelectionStore.getState().select(id)
    return () => {
      if (useSelectionStore.getState().selectedNoradId === id) {
        useSelectionStore.getState().clear()
      }
    }
  }, [found])

  const title = found
    ? `${found.tle.name} (NORAD ${found.tle.noradId}) — Apsis Space`
    : `Satellite ${Number.isFinite(noradId) ? noradId : params.norad_id} — Apsis Space`
  const description = found
    ? generateSatelliteDescription(found)
    : 'Track satellites in real-time 3D on Apsis Space.'
  const canonical = `https://app.apsisspace.com/satellite/${params.norad_id}`

  return (
    <>
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:url" content={canonical} />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        <link rel="canonical" href={canonical} />
      </Helmet>

      {catalog && !found && (
        <div className="pointer-events-auto fixed left-1/2 top-1/2 z-40 -translate-x-1/2 -translate-y-1/2 border border-white/10 bg-[#0a0a0a]/95 p-6 font-mono text-xs text-white/80">
          <h2 className="mb-2 text-sm tracking-widest uppercase text-[#00d4ff]">
            Satellite not found
          </h2>
          <p className="mb-4 max-w-xs text-white/70">
            NORAD {params.norad_id ?? '—'} isn't in the current active catalog.
            It may have decayed, been retired, or the ID is incorrect.
          </p>
          <Link
            href="/"
            className="inline-block border border-[#00d4ff]/40 px-3 py-1.5 text-[#00d4ff] uppercase tracking-widest hover:border-[#00d4ff] hover:bg-[#00d4ff]/10"
          >
            ← Back to tracker
          </Link>
        </div>
      )}
    </>
  )
}

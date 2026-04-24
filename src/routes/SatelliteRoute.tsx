/**
 * /satellite/:norad_id — same tracker as the root route, but enters with
 * the requested satellite pre-selected and swaps in dynamic meta tags for
 * SEO / link previews.
 *
 * When the NORAD ID can't be found in the live catalog we render a small
 * overlay instead of navigating away, so the globe stays visible behind
 * it — helps the user orient themselves and click "Back to tracker".
 *
 * TODO(static-prerender): Browser rendering means Google has to execute JS
 *   to see the Helmet-swapped title/description. That works reliably for
 *   Googlebot today but leaves Twitter/Facebook/Slack unlinked (their
 *   scrapers don't run JS). For those we'd need a separate edge function
 *   that server-renders just <head> for /satellite/:id requests from
 *   known bot user-agents, then streams the rest as a normal SPA. Pre-
 *   rendering 100 full Cesium pages at build time is not worth it — the
 *   globe canvas never ends up in the static HTML anyway.
 */

import { useEffect, useMemo } from 'react'
import { useParams, Link } from 'wouter'
import { Helmet } from 'react-helmet-async'
import App from '../App'
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

  // Memoize on catalog + id so the selection effect below runs once per
  // (catalog, id) change — not every render.
  const found: Satellite | null = useMemo(() => {
    if (!catalog || !Number.isFinite(noradId)) return null
    return catalog.find((s) => s.tle.noradId === noradId) ?? null
  }, [catalog, noradId])

  // Select the requested satellite as soon as we have the catalog. We also
  // clear the selection on unmount so navigating away from the route
  // (via back button or to /satellites) leaves the store in a clean state
  // — otherwise App's URL-sync effect would immediately bounce the user
  // back to /satellite/:id.
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

      <App />

      {/* 404 overlay. Only shown once the catalog has loaded and we know
          the NORAD ID really isn't there — while `catalog` is undefined
          the user sees the normal loading screen from App. */}
      {catalog && !found && (
        <div className="pointer-events-auto absolute left-1/2 top-1/2 z-40 -translate-x-1/2 -translate-y-1/2 border border-white/10 bg-[#0a0a0a]/95 p-6 font-mono text-xs text-white/80">
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

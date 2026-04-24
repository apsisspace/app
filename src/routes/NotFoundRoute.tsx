/**
 * Catch-all 404 page. Kept deliberately tiny — nothing here should tempt
 * crawlers to index it (noindex), and there's no point rehydrating the
 * 3D globe just to tell someone their URL is wrong.
 */

import { Link } from 'wouter'
import { Helmet } from 'react-helmet-async'

export function NotFoundRoute() {
  return (
    <div className="min-h-screen bg-black text-white selection:bg-[#00d4ff]/30">
      <Helmet>
        <title>Not found — Apsis Space</title>
        <meta name="robots" content="noindex" />
      </Helmet>

      <main className="mx-auto flex min-h-screen max-w-[680px] flex-col items-center justify-center px-6 py-12 text-center font-mono">
        <h1 className="mb-6 text-xl font-semibold tracking-[0.3em] uppercase text-[#00d4ff]/80">
          Apsis<span className="text-[#00d4ff]/40"> · </span>Space
        </h1>
        <div className="mb-8 text-[10px] uppercase tracking-widest text-white/40">
          404 — No such page
        </div>
        <Link
          href="/"
          className="inline-block border border-[#00d4ff]/40 px-4 py-2 text-xs uppercase tracking-widest text-[#00d4ff] hover:border-[#00d4ff] hover:bg-[#00d4ff]/10"
        >
          Back to tracker
        </Link>
      </main>
    </div>
  )
}

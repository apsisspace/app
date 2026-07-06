/**
 * /learn — the content hub. Long-form, search-optimized explainers about
 * satellites, orbits, and the sky. Every card links to a crawlable
 * /learn/:slug page, and the hub itself emits ItemList + Breadcrumb
 * structured data so search engines understand the collection.
 */

import { Link } from 'wouter'
import { Helmet } from 'react-helmet-async'
import { ARTICLES } from '../data/articles'
import { articlesByCategory, readingMinutes } from '../lib/articles'
import { ArticleCard } from '../components/ArticleCard'
import { SiteNav, SiteFooter, PageShell } from '../components/SiteChrome'

const CANONICAL = 'https://app.apsisspace.com/learn'
const TITLE = 'Learn — Satellites & Orbits Explained | Apsis Space'
const DESCRIPTION =
  'Plain-English guides to satellites, orbits, and the night sky: how to see the ISS, what Starlink is, how GPS works, space debris, and more.'

export function Learn() {
  const groups = articlesByCategory()
  const featured = ARTICLES[0] ?? null

  const itemListLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Apsis Space — Learn',
    description: DESCRIPTION,
    itemListElement: ARTICLES.map((a, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: `${CANONICAL}/${a.slug}`,
      name: a.title,
    })),
  }
  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Apsis Space', item: 'https://app.apsisspace.com/' },
      { '@type': 'ListItem', position: 2, name: 'Learn', item: CANONICAL },
    ],
  }

  return (
    <PageShell>
      <Helmet>
        <title>{TITLE}</title>
        <meta name="description" content={DESCRIPTION} />
        <link rel="canonical" href={CANONICAL} />
        <meta property="og:title" content={TITLE} />
        <meta property="og:description" content={DESCRIPTION} />
        <meta property="og:url" content={CANONICAL} />
        <meta property="og:type" content="website" />
        <meta name="twitter:title" content={TITLE} />
        <meta name="twitter:description" content={DESCRIPTION} />
        <script type="application/ld+json">{JSON.stringify(itemListLd)}</script>
        <script type="application/ld+json">{JSON.stringify(breadcrumbLd)}</script>
      </Helmet>

      <SiteNav />

      <main className="mx-auto max-w-[900px] px-6 py-12">
        <header className="mb-14 max-w-[640px]">
          <div className="mb-3 font-mono text-[11px] uppercase tracking-[0.3em] text-[#00d4ff]/70">
            Learn
          </div>
          <h1 className="mb-4 text-3xl font-light leading-tight text-white/95 sm:text-4xl">
            The sky overhead, explained.
          </h1>
          <p className="text-base leading-relaxed text-white/60">
            Clear, accurate guides to what's flying above your head — from
            spotting the space station with your naked eye to the orbital
            mechanics behind GPS. Read up, then watch it all move in real time
            on the{' '}
            <Link href="/" className="text-[#00d4ff] hover:underline">
              live tracker
            </Link>
            .
          </p>
        </header>

        {/* Featured article */}
        {featured && (
          <Link
            href={`/learn/${featured.slug}`}
            className="group mb-16 block border border-white/10 bg-gradient-to-br from-[#00d4ff]/[0.06] to-transparent p-7 transition-colors hover:border-[#00d4ff]/50 sm:p-9"
          >
            <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[10px] uppercase tracking-widest text-white/40">
              <span className="text-[#00d4ff]">Featured</span>
              <span aria-hidden>·</span>
              <span>{featured.category}</span>
              <span aria-hidden>·</span>
              <span>{readingMinutes(featured)} min read</span>
            </div>
            <h2 className="mb-3 max-w-[720px] text-2xl font-light leading-snug text-white/95 group-hover:text-white sm:text-3xl">
              {featured.title}
            </h2>
            <p className="max-w-[620px] text-sm leading-relaxed text-white/60 sm:text-base">
              {featured.excerpt}
            </p>
            <span className="mt-5 inline-block font-mono text-[11px] uppercase tracking-widest text-[#00d4ff] group-hover:underline">
              Read the guide &rarr;
            </span>
          </Link>
        )}

        {/* Category groups */}
        <div className="space-y-16">
          {groups.map((group) => (
            <section key={group.category}>
              <h2 className="mb-6 font-mono text-xs font-semibold uppercase tracking-[0.3em] text-[#00d4ff]/80">
                {group.category}
              </h2>
              <div className="grid gap-5 sm:grid-cols-2">
                {group.articles.map((a) => (
                  <ArticleCard key={a.slug} article={a} />
                ))}
              </div>
            </section>
          ))}
        </div>
      </main>

      <SiteFooter />
    </PageShell>
  )
}

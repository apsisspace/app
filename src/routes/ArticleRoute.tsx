/**
 * /learn/:slug — a single long-form article.
 *
 * Renders the article body plus a full complement of SEO structured data:
 *   - Article       (headline, description, dates, author/publisher)
 *   - FAQPage       (from the article's FAQs — rich-result eligible)
 *   - BreadcrumbList (Home › Learn › article)
 *
 * Unknown slugs render a friendly "not found" with a route back to /learn.
 */

import { useParams, Link } from 'wouter'
import { Helmet } from 'react-helmet-async'
import {
  getArticle,
  readingMinutes,
  relatedArticles,
  formatArticleDate,
} from '../lib/articles'
import { ArticleCard } from '../components/ArticleCard'
import { SiteNav, SiteFooter, PageShell } from '../components/SiteChrome'

const ORIGIN = 'https://app.apsisspace.com'

export function ArticleRoute() {
  const params = useParams<{ slug?: string }>()
  const article = getArticle(params.slug)

  if (!article) {
    return (
      <PageShell>
        <SiteNav />
        <main className="mx-auto max-w-[680px] px-6 py-24 text-center font-mono">
          <h1 className="mb-3 text-sm uppercase tracking-widest text-[#00d4ff]">
            Article not found
          </h1>
          <p className="mb-6 text-sm text-white/60">
            We couldn't find “{params.slug}”. It may have been renamed.
          </p>
          <Link
            href="/learn"
            className="inline-block border border-[#00d4ff]/40 px-4 py-2 text-[11px] uppercase tracking-widest text-[#00d4ff] hover:border-[#00d4ff] hover:bg-[#00d4ff]/10"
          >
            &larr; All guides
          </Link>
        </main>
        <SiteFooter />
      </PageShell>
    )
  }

  const canonical = `${ORIGIN}/learn/${article.slug}`
  const pageTitle = `${article.metaTitle} — Apsis Space`
  const related = relatedArticles(article)

  const articleLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.metaDescription,
    keywords: article.keywords.join(', '),
    datePublished: article.updated,
    dateModified: article.updated,
    mainEntityOfPage: { '@type': 'WebPage', '@id': canonical },
    author: { '@type': 'Organization', name: 'Apsis Space', url: 'https://apsisspace.com' },
    publisher: {
      '@type': 'Organization',
      name: 'Apsis Space',
      url: 'https://apsisspace.com',
      logo: { '@type': 'ImageObject', url: `${ORIGIN}/apple-touch-icon.png` },
    },
  }
  const faqLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: article.faqs.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  }
  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Apsis Space', item: `${ORIGIN}/` },
      { '@type': 'ListItem', position: 2, name: 'Learn', item: `${ORIGIN}/learn` },
      { '@type': 'ListItem', position: 3, name: article.title, item: canonical },
    ],
  }

  return (
    <PageShell>
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={article.metaDescription} />
        <meta name="keywords" content={article.keywords.join(', ')} />
        <link rel="canonical" href={canonical} />
        <meta property="og:type" content="article" />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={article.metaDescription} />
        <meta property="og:url" content={canonical} />
        <meta property="og:image" content={`${ORIGIN}/og-image.png`} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={article.metaDescription} />
        <script type="application/ld+json">{JSON.stringify(articleLd)}</script>
        <script type="application/ld+json">{JSON.stringify(faqLd)}</script>
        <script type="application/ld+json">{JSON.stringify(breadcrumbLd)}</script>
      </Helmet>

      <SiteNav maxWidth="max-w-[760px]" />

      <article className="mx-auto max-w-[720px] px-6 py-12">
        {/* Breadcrumb */}
        <nav className="mb-8 font-mono text-[10px] uppercase tracking-widest text-white/40">
          <Link href="/learn" className="hover:text-[#00d4ff]">
            Learn
          </Link>
          <span className="mx-2" aria-hidden>
            /
          </span>
          <span className="text-[#00d4ff]/70">{article.category}</span>
        </nav>

        {/* Header */}
        <header className="mb-10">
          <h1 className="mb-4 text-3xl font-light leading-tight text-white/95 sm:text-4xl">
            {article.title}
          </h1>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[10px] uppercase tracking-widest text-white/40">
            <span>{readingMinutes(article)} min read</span>
            <span aria-hidden>·</span>
            <span>Reviewed {formatArticleDate(article.updated)}</span>
          </div>
        </header>

        {/* Hero stat callout */}
        <div className="mb-10 flex items-baseline gap-4 border-l-2 border-[#00d4ff]/60 bg-[#00d4ff]/[0.04] px-5 py-4">
          <span className="font-mono text-2xl font-semibold text-[#00d4ff] sm:text-3xl">
            {article.heroStat.value}
          </span>
          <span className="text-sm leading-snug text-white/60">
            {article.heroStat.label}
          </span>
        </div>

        {/* Body */}
        <div className="space-y-10">
          {article.sections.map((section, i) => (
            <section key={i}>
              <h2 className="mb-3 text-xl font-medium text-white/90">
                {section.heading}
              </h2>
              <div className="space-y-4">
                {section.paragraphs.map((p, j) => (
                  <p key={j} className="text-[15px] leading-relaxed text-white/70">
                    {p}
                  </p>
                ))}
              </div>
            </section>
          ))}
        </div>

        {/* FAQ */}
        {article.faqs.length > 0 && (
          <section className="mt-16">
            <h2 className="mb-6 font-mono text-xs font-semibold uppercase tracking-[0.3em] text-[#00d4ff]/80">
              Frequently asked
            </h2>
            <dl className="divide-y divide-white/10 border-y border-white/10">
              {article.faqs.map((f, i) => (
                <div key={i} className="py-5">
                  <dt className="mb-2 text-[15px] font-medium text-white/90">
                    {f.q}
                  </dt>
                  <dd className="text-[15px] leading-relaxed text-white/60">
                    {f.a}
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        )}

        {/* CTA */}
        <section className="mt-16 border border-[#00d4ff]/20 bg-[#00d4ff]/[0.04] p-6 text-center">
          <p className="mb-4 text-sm text-white/70">
            See it for yourself — watch every active satellite move in real time.
          </p>
          <Link
            href="/"
            className="inline-block border border-[#00d4ff]/50 px-5 py-2.5 font-mono text-[11px] uppercase tracking-widest text-[#00d4ff] transition-colors hover:border-[#00d4ff] hover:bg-[#00d4ff]/10"
          >
            Open the live tracker &rarr;
          </Link>
        </section>

        {/* Sources */}
        {article.sources.length > 0 && (
          <section className="mt-14">
            <h2 className="mb-4 font-mono text-[10px] font-semibold uppercase tracking-[0.3em] text-white/40">
              Sources
            </h2>
            <ul className="space-y-2 text-[13px]">
              {article.sources.map((s, i) => (
                <li key={i}>
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    className="text-white/50 underline decoration-white/20 underline-offset-2 transition-colors hover:text-[#00d4ff] hover:decoration-[#00d4ff]/50"
                  >
                    {s.title}
                  </a>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Related */}
        {related.length > 0 && (
          <section className="mt-16">
            <h2 className="mb-6 font-mono text-xs font-semibold uppercase tracking-[0.3em] text-[#00d4ff]/80">
              Keep reading
            </h2>
            <div className="grid gap-5 sm:grid-cols-2">
              {related.map((a) => (
                <ArticleCard key={a.slug} article={a} />
              ))}
            </div>
          </section>
        )}
      </article>

      <SiteFooter maxWidth="max-w-[760px]" />
    </PageShell>
  )
}

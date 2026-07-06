/**
 * Types for the /learn content hub. Articles are static, hand-curated
 * long-form pages authored for organic search + reader education. Each one
 * renders its own <title>, meta description, and Article + FAQPage JSON-LD
 * so search engines can surface them as rich results.
 */

export interface ArticleSource {
  title: string
  url: string
}

export interface ArticleSection {
  heading: string
  paragraphs: string[]
}

export interface ArticleFaq {
  q: string
  a: string
}

export interface ArticleHeroStat {
  label: string
  value: string
}

export type ArticleCategory =
  | 'Observing'
  | 'Orbits'
  | 'Constellations'
  | 'Debris'
  | 'Navigation'
  | 'Basics'

export interface Article {
  /** kebab-case URL slug — /learn/:slug. */
  slug: string
  /** H1 / reader-facing title. */
  title: string
  /** SEO <title> (kept ≤ 60 chars). */
  metaTitle: string
  /** Meta description (120–155 chars). */
  metaDescription: string
  category: ArticleCategory
  /** 1–2 sentence summary for hub cards + og:description. */
  excerpt: string
  /** SEO keywords / phrases. */
  keywords: string[]
  /** Punchy callout stat rendered in the article hero. */
  heroStat: ArticleHeroStat
  sections: ArticleSection[]
  /** FAQ entries — also emitted as FAQPage structured data. */
  faqs: ArticleFaq[]
  sources: ArticleSource[]
  /** ISO date (YYYY-MM-DD) the entry was last fact-reviewed. */
  updated: string
  /** Related article slugs (invalid slugs are ignored at render). */
  related: string[]
}

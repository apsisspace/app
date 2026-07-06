/**
 * Helpers over the /learn article set: lookup, related-article resolution,
 * category grouping, reading-time estimate, and date formatting.
 */

import { ARTICLES } from '../data/articles'
import type { Article, ArticleCategory } from '../types/article'

/** Display order for category groupings on the hub. */
export const CATEGORY_ORDER: ArticleCategory[] = [
  'Observing',
  'Constellations',
  'Orbits',
  'Navigation',
  'Debris',
  'Basics',
]

export function getArticle(slug: string | undefined): Article | null {
  if (!slug) return null
  return ARTICLES.find((a) => a.slug === slug) ?? null
}

/** All words across the article body — used for the reading-time estimate. */
function wordCount(article: Article): number {
  let words = 0
  for (const s of article.sections) {
    for (const p of s.paragraphs) {
      words += p.trim().split(/\s+/).filter(Boolean).length
    }
  }
  return words
}

/** Rounded minutes at ~220 wpm, floored at 1. */
export function readingMinutes(article: Article): number {
  return Math.max(1, Math.round(wordCount(article) / 220))
}

/**
 * Resolve an article's `related` slugs to real articles, dropping any that
 * don't exist. Falls back to same-category articles (then anything) so a card
 * strip is never empty.
 */
export function relatedArticles(article: Article, limit = 3): Article[] {
  const out: Article[] = []
  const seen = new Set<string>([article.slug])

  const push = (a: Article | null | undefined) => {
    if (a && !seen.has(a.slug) && out.length < limit) {
      seen.add(a.slug)
      out.push(a)
    }
  }

  for (const slug of article.related) push(getArticle(slug))
  if (out.length < limit) {
    for (const a of ARTICLES) {
      if (a.category === article.category) push(a)
    }
  }
  if (out.length < limit) {
    for (const a of ARTICLES) push(a)
  }
  return out
}

export interface CategoryGroup {
  category: ArticleCategory
  articles: Article[]
}

/** Articles grouped by category in CATEGORY_ORDER, skipping empty groups. */
export function articlesByCategory(): CategoryGroup[] {
  return CATEGORY_ORDER.map((category) => ({
    category,
    articles: ARTICLES.filter((a) => a.category === category),
  })).filter((g) => g.articles.length > 0)
}

/** "Jul 6, 2026" from an ISO YYYY-MM-DD string. Robust to bad input. */
export function formatArticleDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  })
}

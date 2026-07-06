/**
 * Compact article card used on the /learn hub and in the "related reading"
 * strip on each article. Whole card is a single link for a large tap target.
 */

import { Link } from 'wouter'
import type { Article } from '../types/article'
import { readingMinutes } from '../lib/articles'

export function ArticleCard({ article }: { article: Article }) {
  return (
    <Link
      href={`/learn/${article.slug}`}
      className="group flex h-full flex-col border border-white/10 bg-white/[0.02] p-5 transition-colors hover:border-[#00d4ff]/50 hover:bg-white/[0.04]"
    >
      <div className="mb-3 flex items-center justify-between font-mono text-[10px] uppercase tracking-widest text-white/40">
        <span className="text-[#00d4ff]/80">{article.category}</span>
        <span>{readingMinutes(article)} min read</span>
      </div>
      <h3 className="mb-2 text-lg font-medium leading-snug text-white/90 group-hover:text-white">
        {article.title}
      </h3>
      <p className="mb-4 flex-1 text-sm leading-relaxed text-white/55">
        {article.excerpt}
      </p>
      <span className="font-mono text-[11px] uppercase tracking-widest text-[#00d4ff] group-hover:underline">
        Read &rarr;
      </span>
    </Link>
  )
}

#!/usr/bin/env node
/**
 * Emit public/sitemap.xml at build time.
 *
 * Includes:
 *   - /               (homepage, priority 1.0, weekly)
 *   - /about          (priority 0.7, monthly)
 *   - /satellites     (priority 0.7, weekly)
 *   - /satellite/:id  for each curated NORAD ID (priority 0.6, daily)
 *
 * changefreq=daily on the per-satellite pages because TLEs update
 * multiple times a day; search engines should revisit to pick up fresh
 * inclination/period summaries in the meta description.
 *
 * We parse src/data/notableSatellites.ts with a regex rather than
 * importing it, to sidestep the ESM-import-of-a-TS-file problem without
 * pulling in a TS loader for a single build script. The file is
 * hand-maintained and has a simple { noradId: NUMBER } shape.
 */

import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const SOURCE = resolve(here, '..', 'src', 'data', 'notableSatellites.ts')
const ARTICLES_SOURCE = resolve(here, '..', 'src', 'data', 'articles.ts')
const OUTPUT = resolve(here, '..', 'public', 'sitemap.xml')
const BASE_URL = 'https://app.apsisspace.com'

function readNoradIds(path) {
  const text = readFileSync(path, 'utf8')
  const ids = new Set()
  const re = /noradId:\s*(\d+)/g
  let m
  while ((m = re.exec(text)) !== null) {
    ids.add(Number(m[1]))
  }
  return [...ids].sort((a, b) => a - b)
}

/** Extract /learn article slugs. articles.ts is generated JSON-ish, so the
 *  top-level "slug": "..." shape is stable and safe to regex. */
function readArticleSlugs(path) {
  const text = readFileSync(path, 'utf8')
  const slugs = new Set()
  const re = /"slug":\s*"([a-z0-9-]+)"/g
  let m
  while ((m = re.exec(text)) !== null) {
    slugs.add(m[1])
  }
  return [...slugs].sort()
}

function urlEntry(loc, priority, changefreq, lastmod) {
  return [
    '  <url>',
    `    <loc>${loc}</loc>`,
    `    <lastmod>${lastmod}</lastmod>`,
    `    <changefreq>${changefreq}</changefreq>`,
    `    <priority>${priority}</priority>`,
    '  </url>',
  ].join('\n')
}

function main() {
  const ids = readNoradIds(SOURCE)
  if (ids.length === 0) {
    console.error('[generate-sitemap] no NORAD IDs found in', SOURCE)
    process.exit(1)
  }

  const slugs = readArticleSlugs(ARTICLES_SOURCE)

  const today = new Date().toISOString().slice(0, 10)
  const entries = [
    urlEntry(`${BASE_URL}/`, '1.0', 'weekly', today),
    urlEntry(`${BASE_URL}/learn`, '0.8', 'weekly', today),
    urlEntry(`${BASE_URL}/stats`, '0.7', 'daily', today),
    urlEntry(`${BASE_URL}/about`, '0.7', 'monthly', today),
    urlEntry(`${BASE_URL}/satellites`, '0.7', 'weekly', today),
    ...slugs.map((slug) =>
      urlEntry(`${BASE_URL}/learn/${slug}`, '0.7', 'monthly', today),
    ),
    ...ids.map((id) =>
      urlEntry(`${BASE_URL}/satellite/${id}`, '0.6', 'daily', today),
    ),
  ]

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...entries,
    '</urlset>',
    '',
  ].join('\n')

  writeFileSync(OUTPUT, xml, 'utf8')
  console.log(
    `[generate-sitemap] wrote ${entries.length} URLs (${ids.length} satellites) to ${OUTPUT}`,
  )
}

main()

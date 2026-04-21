/**
 * Shared TLE catalog fetcher used by both /api/catalog (proxy) and the
 * get_satellite_info / search_catalog tools in /api/query.
 *
 * Keeps a module-scoped 1-hour cache of the parsed catalog so repeated
 * tool calls inside a single query (or repeated queries within an isolate)
 * don't re-hit Celestrak.
 *
 * Edge Function compatible: pure `fetch` + JS — no Node APIs.
 */

export interface TLE {
  name: string
  noradId: number
  line1: string
  line2: string
}

const CELESTRAK_URL =
  'https://celestrak.org/NORAD/elements/gp.php?GROUP=active&FORMAT=TLE'

const USER_AGENT =
  'ApsisSpace/0.1 (apsisspace.com; aidanfeess@apsisspace.com)'

const TTL_MS = 60 * 60 * 1000

interface Cache {
  text: string
  tles: TLE[]
  noradIndex: Map<number, TLE>
  fetchedAt: number
}

let cache: Cache | null = null
let inflight: Promise<Cache> | null = null

export function parseTLEBlob(text: string): TLE[] {
  const lines = text.split(/\r?\n/).map((l) => l.trimEnd())
  const out: TLE[] = []
  for (let i = 0; i + 2 < lines.length; ) {
    while (i < lines.length && lines[i].trim() === '') i++
    if (i + 2 >= lines.length) break
    const name = lines[i].trim()
    const line1 = lines[i + 1]
    const line2 = lines[i + 2]
    if (!line1.startsWith('1 ') || !line2.startsWith('2 ')) {
      // Misaligned block — bail rather than quietly corrupt the catalog.
      throw new Error(`TLE block starting at line ${i} is malformed`)
    }
    const noradId = parseInt(line1.substring(2, 7).trim(), 10)
    if (Number.isFinite(noradId)) {
      out.push({ name, line1, line2, noradId })
    }
    i += 3
  }
  return out
}

async function fetchFresh(): Promise<Cache> {
  const upstream = await fetch(CELESTRAK_URL, {
    headers: { 'user-agent': USER_AGENT, accept: 'text/plain' },
  })
  if (!upstream.ok) {
    throw new Error(`Celestrak upstream ${upstream.status} ${upstream.statusText}`)
  }
  const text = await upstream.text()
  if (/no gp data found/i.test(text) || text.length < 100) {
    throw new Error('Celestrak returned an empty catalog')
  }
  const tles = parseTLEBlob(text)
  const noradIndex = new Map<number, TLE>()
  for (const t of tles) noradIndex.set(t.noradId, t)
  return { text, tles, noradIndex, fetchedAt: Date.now() }
}

/**
 * Return the live catalog, using a 1-hour in-memory cache. Throws on
 * upstream failure only when no cached copy exists; otherwise serves stale
 * data (the HTTP catalog endpoint degrades the same way).
 */
export async function getCatalog(): Promise<Cache> {
  const now = Date.now()
  if (cache && now - cache.fetchedAt < TTL_MS) return cache
  if (inflight) return inflight
  inflight = (async () => {
    try {
      const fresh = await fetchFresh()
      cache = fresh
      return fresh
    } catch (err) {
      if (cache) {
        console.warn('[catalog] fetch failed, serving stale cache:', err)
        return cache
      }
      throw err
    } finally {
      inflight = null
    }
  })()
  return inflight
}

/**
 * Same as getCatalog but only returns the raw TLE text — used by the
 * /api/catalog HTTP proxy. Exposes cache age so the proxy can set
 * `x-cache` headers identically to before.
 */
export async function getCatalogText(): Promise<{
  text: string
  ageSeconds: number
  stale: boolean
}> {
  const now = Date.now()
  if (cache && now - cache.fetchedAt < TTL_MS) {
    return {
      text: cache.text,
      ageSeconds: Math.floor((now - cache.fetchedAt) / 1000),
      stale: false,
    }
  }
  try {
    const fresh = await fetchFresh()
    cache = fresh
    return { text: fresh.text, ageSeconds: 0, stale: false }
  } catch (err) {
    if (cache) {
      return {
        text: cache.text,
        ageSeconds: Math.floor((now - cache.fetchedAt) / 1000),
        stale: true,
      }
    }
    throw err
  }
}

export function findByNoradId(cat: Cache, id: number): TLE | null {
  return cat.noradIndex.get(id) ?? null
}

export function searchByName(cat: Cache, query: string, limit: number): TLE[] {
  const q = query.toLowerCase().trim()
  if (!q) return []
  const out: TLE[] = []
  for (const t of cat.tles) {
    if (t.name.toLowerCase().includes(q)) {
      out.push(t)
      if (out.length >= limit) break
    }
  }
  return out
}

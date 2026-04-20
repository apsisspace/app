/**
 * localStorage-backed cache for the active catalog TLE blob.
 *
 * Storing raw TLE text (not the parsed Satellite[]) keeps the cache
 * small (~2 MB for ~10k satellites vs. many MB for serialized objects)
 * and lets us reuse the existing `parseTLEBlob` on load.
 */

const LS_KEY = 'apsis:catalog:v1'
const FRESH_TTL_MS = 60 * 60 * 1000 // 1 hour

interface CatalogCacheEntry {
  text: string
  fetchedAt: number
}

export interface ReadCatalogCacheResult {
  entry: CatalogCacheEntry | null
  fresh: boolean
}

export function readCatalogCache(): ReadCatalogCacheResult {
  try {
    const raw = typeof localStorage !== 'undefined'
      ? localStorage.getItem(LS_KEY)
      : null
    if (!raw) return { entry: null, fresh: false }
    const parsed = JSON.parse(raw) as CatalogCacheEntry
    if (
      typeof parsed?.text !== 'string' ||
      typeof parsed?.fetchedAt !== 'number'
    ) {
      return { entry: null, fresh: false }
    }
    const fresh = Date.now() - parsed.fetchedAt < FRESH_TTL_MS
    return { entry: parsed, fresh }
  } catch {
    return { entry: null, fresh: false }
  }
}

export function writeCatalogCache(text: string): void {
  try {
    if (typeof localStorage === 'undefined') return
    const entry: CatalogCacheEntry = { text, fetchedAt: Date.now() }
    localStorage.setItem(LS_KEY, JSON.stringify(entry))
  } catch {
    // QuotaExceededError or Safari private-mode — silently drop.
  }
}

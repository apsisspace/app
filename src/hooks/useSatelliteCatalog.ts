/**
 * TanStack Query hook for the active satellite catalog.
 *
 * Data flow:
 *   1. Try localStorage. If fresh (<1 h), return immediately — no network.
 *   2. Otherwise fetch /api/catalog (our Vercel Edge proxy).
 *   3. On fetch error, fall back to stale localStorage if we have it —
 *      the user still sees satellites; the next refresh tries again.
 *   4. If there's no cache to fall back to, throw. TanStack Query retries
 *      every 30 s indefinitely; the UI renders a friendly waiting state.
 *
 * We deliberately do NOT fetch from Celestrak directly anymore: browsers
 * can't set User-Agent on fetch(), Celestrak 403s UA-less traffic, and a
 * shared proxy also amortizes hits to Celestrak across all users.
 */

import { useQuery } from '@tanstack/react-query'
import { parseTLEBlob } from '../lib/celestrak'
import { readCatalogCache, writeCatalogCache } from '../lib/catalogCache'
import type { Satellite } from '../types/satellite'

const API_URL = '/api/catalog'
const RETRY_DELAY_MS = 30_000

function tlesToSatellites(text: string): Satellite[] {
  return parseTLEBlob(text).map((tle) => ({ tle }))
}

async function loadCatalog(): Promise<Satellite[]> {
  const cache = readCatalogCache()

  // Fresh cache → zero network.
  if (cache.fresh && cache.entry) {
    return tlesToSatellites(cache.entry.text)
  }

  try {
    const res = await fetch(API_URL, { cache: 'no-store' })
    if (!res.ok) {
      throw new Error(`catalog proxy ${res.status}`)
    }
    const text = await res.text()
    writeCatalogCache(text)
    return tlesToSatellites(text)
  } catch (err) {
    // Network / proxy failed — serve stale cache if we have one, else rethrow
    // so TanStack Query's retry kicks in.
    if (cache.entry) {
      return tlesToSatellites(cache.entry.text)
    }
    throw err
  }
}

export function useSatelliteCatalog() {
  return useQuery<Satellite[]>({
    queryKey: ['catalog', 'active'],
    queryFn: loadCatalog,
    retry: Infinity,
    retryDelay: RETRY_DELAY_MS,
    // We already cache in localStorage with our own TTL; TanStack's in-memory
    // freshness can match so we don't refetch on every component mount.
    staleTime: 60 * 60 * 1000,
  })
}

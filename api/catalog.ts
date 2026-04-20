/**
 * Vercel Edge Function: /api/catalog
 *
 * Proxies Celestrak's GP "active" group and adds:
 *   - A proper User-Agent (Celestrak 403s default/missing UAs).
 *   - A 1h in-memory cache shared across invocations within the same
 *     Edge isolate. Different edge regions/isolates maintain their own
 *     caches, which is fine — worst case we hit Celestrak once per
 *     region per hour instead of once per client per load.
 *   - Graceful degradation: on upstream error (including 403), the last
 *     successful response is returned with an X-Cache: STALE header so
 *     clients can still boot without a friendly-error state.
 *
 * TODO(ai): Same proxy pattern will wrap the Claude API when the AI
 *   layer lands (distinct route, different cache policy).
 * TODO(full-catalog): Swap to Vercel KV when we need multi-region /
 *   multi-invocation persistence of the cache.
 */

export const config = { runtime: 'edge' }

const CELESTRAK_URL =
  'https://celestrak.org/NORAD/elements/gp.php?GROUP=active&FORMAT=TLE'

const USER_AGENT =
  'ApsisSpace/0.1 (apsisspace.com; aidanfeess@apsisspace.com)'

const TTL_MS = 60 * 60 * 1000 // 1 hour

const CORS_HEADERS: Record<string, string> = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET, OPTIONS',
  'access-control-allow-headers': 'content-type',
}

interface CacheEntry {
  text: string
  fetchedAt: number
}

// Module-scoped singleton. Persists for the life of the Edge isolate.
let cache: CacheEntry | null = null

function textResponse(
  body: string,
  status: number,
  extraHeaders: Record<string, string> = {},
): Response {
  return new Response(body, {
    status,
    headers: {
      'content-type': 'text/plain; charset=utf-8',
      'cache-control': 'public, max-age=3600',
      ...CORS_HEADERS,
      ...extraHeaders,
    },
  })
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS })
  }

  const now = Date.now()

  // Fresh cache hit — serve without touching Celestrak.
  if (cache && now - cache.fetchedAt < TTL_MS) {
    return textResponse(cache.text, 200, {
      'x-cache': 'HIT',
      'x-cache-age-s': String(Math.floor((now - cache.fetchedAt) / 1000)),
    })
  }

  try {
    const upstream = await fetch(CELESTRAK_URL, {
      headers: { 'user-agent': USER_AGENT, accept: 'text/plain' },
    })

    if (!upstream.ok) {
      console.warn(
        `[catalog] Celestrak upstream ${upstream.status} ${upstream.statusText}`,
      )
      if (cache) {
        return textResponse(cache.text, 200, {
          'x-cache': 'STALE',
          'x-upstream-status': String(upstream.status),
        })
      }
      return textResponse(
        `Celestrak upstream error: ${upstream.status}`,
        502,
        { 'x-upstream-status': String(upstream.status) },
      )
    }

    const text = await upstream.text()
    if (/no gp data found/i.test(text) || text.length < 100) {
      // Upstream returned 200 with a useless body; treat as error.
      if (cache) {
        return textResponse(cache.text, 200, {
          'x-cache': 'STALE',
          'x-upstream-status': 'empty',
        })
      }
      return textResponse('Celestrak returned empty catalog', 502)
    }

    cache = { text, fetchedAt: now }
    return textResponse(text, 200, { 'x-cache': 'MISS' })
  } catch (err) {
    console.error('[catalog] fetch threw:', err)
    if (cache) {
      return textResponse(cache.text, 200, {
        'x-cache': 'STALE-ERROR',
      })
    }
    return textResponse(
      `Upstream fetch failed: ${err instanceof Error ? err.message : String(err)}`,
      502,
    )
  }
}

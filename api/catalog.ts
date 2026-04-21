/**
 * Vercel Edge Function: /api/catalog
 *
 * Proxies Celestrak's GP "active" group. Fetch + cache live in
 * api/_lib/catalog so the TLE set is shared with the /api/query tool
 * layer (no duplicated Celestrak traffic inside a single isolate).
 *
 * Behaviour:
 *   - Fresh cache hit  → 200, x-cache: HIT
 *   - Fresh fetch       → 200, x-cache: MISS
 *   - Upstream failed,
 *     stale available  → 200, x-cache: STALE
 *   - No cache at all  → 502 with the upstream error
 */

import { getCatalogText } from './_lib/catalog.js'

export const config = { runtime: 'edge' }

const CORS_HEADERS: Record<string, string> = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET, OPTIONS',
  'access-control-allow-headers': 'content-type',
}

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

  try {
    const { text, ageSeconds, stale } = await getCatalogText()
    const headers: Record<string, string> = {
      'x-cache': stale ? 'STALE' : ageSeconds === 0 ? 'MISS' : 'HIT',
      'x-cache-age-s': String(ageSeconds),
    }
    return textResponse(text, 200, headers)
  } catch (err) {
    console.error('[catalog] fetch threw:', err)
    return textResponse(
      `Upstream fetch failed: ${err instanceof Error ? err.message : String(err)}`,
      502,
    )
  }
}

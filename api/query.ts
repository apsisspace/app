/**
 * Vercel Edge Function: POST /api/query
 *
 * Answers plain-English questions about satellites and orbits via Claude
 * Haiku 4.5. Applies two rate-limit gates before spending tokens:
 *   1. Per-IP daily cap  — 20 queries / IP / UTC day.
 *   2. Global daily cap  — $5 / UTC day across all users.
 *
 * Both counters live in Upstash Redis (REST client works from Edge).
 *
 * Error contract (JSON bodies):
 *   400 { error: 'invalid_question',      message }
 *   429 { error: 'daily_limit_reached',   message }
 *   503 { error: 'daily_budget_reached',  message }
 *   502 { error: 'upstream_error',        message }
 *   500 { error: 'internal_error',        message }
 */

import Anthropic from '@anthropic-ai/sdk'
import { Redis } from '@upstash/redis'

export const config = { runtime: 'edge' }

// User-specified Haiku pricing ($ per 1M tokens). Used for budget math only;
// if we retune, change these two constants.
const INPUT_PRICE_PER_M = 0.25
const OUTPUT_PRICE_PER_M = 1.25

const MODEL = 'claude-haiku-4-5-20251001'
const MAX_TOKENS = 500
const TEMPERATURE = 0.5

const PER_IP_DAILY_LIMIT = 20
const GLOBAL_DAILY_BUDGET_USD = 5

// Worst-case estimate for the pre-flight budget check: a full-length
// request + response. This is deliberately slightly pessimistic so we
// don't race past the cap.
const WORST_CASE_USD =
  ((/* input  */ 800 * INPUT_PRICE_PER_M) / 1_000_000) +
  ((/* output */ MAX_TOKENS * OUTPUT_PRICE_PER_M) / 1_000_000)

const MAX_QUESTION_CHARS = 500

const CORS_HEADERS: Record<string, string> = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'POST, OPTIONS',
  'access-control-allow-headers': 'content-type',
}

// System prompt — static, cacheable block. The current timestamp is
// appended as a SEPARATE (uncached) system block so it can vary per
// request without invalidating the cached prefix.
const SYSTEM_PROMPT = `You are Apsis, the AI assistant for Apsis Space — a browser-based satellite tracker.

Your role: help users understand what they're seeing. Answer plain-English questions about satellites, orbits, and the catalog. Be concrete and concise. Two to four short sentences is usually right; longer only when the question genuinely demands it.

Tone: knowledgeable, curious, a little playful — like a friendly expert hanging over the user's shoulder. Never stuffy. Never hedging with "I'm an AI" disclaimers.

Scope:
- Satellites, orbits, space operations, astronomy basics, Apsis Space itself.
- If asked something off-topic, redirect politely in one line.

Facts & accuracy:
- If the user has a satellite selected, its details are provided in the turn. Prefer those numbers over anything you might recall.
- If you don't know, say so briefly — do not invent TLEs, NORAD IDs, or pass times.
- Do not claim live visibility predictions (they require the user's location and time, which we don't have yet).

Formatting:
- Plain text only. No markdown, no bullet lists, no headings, no code blocks.
- No emoji.
- No sign-offs.`

interface QueryBody {
  question?: unknown
  context?: {
    selectedSatellite?: {
      norad_id?: unknown
      name?: unknown
      inclination?: unknown
      period?: unknown
      epoch?: unknown
    }
  }
}

interface SelectedSatelliteContext {
  norad_id: number
  name: string
  inclination: number
  period: number
  epoch: string
}

// ---------- helpers --------------------------------------------------------

function jsonResponse(
  body: unknown,
  status: number,
  extra: Record<string, string> = {},
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      ...CORS_HEADERS,
      ...extra,
    },
  })
}

/** Sanitize the question: trim, strip control chars, enforce length. */
function sanitizeQuestion(raw: unknown): { ok: true; value: string } | { ok: false; message: string } {
  if (typeof raw !== 'string') {
    return { ok: false, message: 'Question must be a string.' }
  }
  // Strip C0/C1 control characters but keep normal whitespace/newlines.
  // eslint-disable-next-line no-control-regex
  const stripped = raw.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g, '')
  const trimmed = stripped.trim()
  if (trimmed.length === 0) {
    return { ok: false, message: 'Question cannot be empty.' }
  }
  if (trimmed.length > MAX_QUESTION_CHARS) {
    return { ok: false, message: `Question must be ${MAX_QUESTION_CHARS} characters or fewer.` }
  }
  return { ok: true, value: trimmed }
}

function parseSelectedSatellite(
  ctx: QueryBody['context'],
): SelectedSatelliteContext | null {
  const s = ctx?.selectedSatellite
  if (!s) return null
  const norad = typeof s.norad_id === 'number' ? s.norad_id : Number(s.norad_id)
  const inclination = typeof s.inclination === 'number' ? s.inclination : Number(s.inclination)
  const period = typeof s.period === 'number' ? s.period : Number(s.period)
  if (
    !Number.isFinite(norad) ||
    !Number.isFinite(inclination) ||
    !Number.isFinite(period) ||
    typeof s.name !== 'string' ||
    typeof s.epoch !== 'string'
  ) {
    return null
  }
  return {
    norad_id: norad,
    name: s.name.slice(0, 120),
    inclination,
    period,
    epoch: s.epoch.slice(0, 40),
  }
}

function clientIp(req: Request): string {
  const xff = req.headers.get('x-forwarded-for')
  if (xff) {
    const first = xff.split(',')[0]?.trim()
    if (first) return first
  }
  const xri = req.headers.get('x-real-ip')
  if (xri) return xri.trim()
  return 'unknown'
}

function utcDayStamp(now = new Date()): string {
  // YYYYMMDD
  const y = now.getUTCFullYear()
  const m = String(now.getUTCMonth() + 1).padStart(2, '0')
  const d = String(now.getUTCDate()).padStart(2, '0')
  return `${y}${m}${d}`
}

function secondsUntilNextUtcMidnight(now = new Date()): number {
  const next = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate() + 1,
    0, 0, 0, 0,
  )
  return Math.max(60, Math.ceil((next - now.getTime()) / 1000))
}

/** Build the Redis client. Returns null if env is missing (degrades open). */
function getRedis(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) {
    console.warn('[query] Upstash Redis env missing — rate limiting disabled')
    return null
  }
  return new Redis({ url, token })
}

// ---------- handler --------------------------------------------------------

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS })
  }
  if (req.method !== 'POST') {
    return jsonResponse({ error: 'method_not_allowed', message: 'Use POST.' }, 405)
  }

  // ---- parse & validate body ----
  let body: QueryBody
  try {
    body = (await req.json()) as QueryBody
  } catch {
    return jsonResponse(
      { error: 'invalid_question', message: 'Body must be valid JSON.' },
      400,
    )
  }

  const parsed = sanitizeQuestion(body?.question)
  if (!parsed.ok) {
    return jsonResponse({ error: 'invalid_question', message: parsed.message }, 400)
  }
  const question = parsed.value
  const selected = parseSelectedSatellite(body?.context)

  // ---- rate limit + budget gates ----
  const redis = getRedis()
  const today = utcDayStamp()
  const ttl = secondsUntilNextUtcMidnight()
  const ip = clientIp(req)

  if (redis) {
    try {
      const ipKey = `ratelimit:${ip}:${today}`
      const ipCount = await redis.incr(ipKey)
      if (ipCount === 1) {
        await redis.expire(ipKey, ttl)
      }
      if (ipCount > PER_IP_DAILY_LIMIT) {
        return jsonResponse(
          {
            error: 'daily_limit_reached',
            message: `You've hit the daily limit of ${PER_IP_DAILY_LIMIT} questions. Try again after UTC midnight.`,
          },
          429,
        )
      }

      const budgetKey = `budget:${today}`
      const spentRaw = await redis.get<string | number>(budgetKey)
      const spent = typeof spentRaw === 'number' ? spentRaw : parseFloat(String(spentRaw ?? '0')) || 0
      if (spent + WORST_CASE_USD > GLOBAL_DAILY_BUDGET_USD) {
        return jsonResponse(
          {
            error: 'daily_budget_reached',
            message: "Apsis has reached today's AI budget. Try again after UTC midnight.",
          },
          503,
        )
      }
    } catch (err) {
      // Redis outage: fail OPEN so users aren't locked out by infra.
      console.error('[query] Redis error (failing open):', err)
    }
  }

  // ---- call Claude ----
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return jsonResponse(
      { error: 'internal_error', message: 'Server is missing ANTHROPIC_API_KEY.' },
      500,
    )
  }
  const client = new Anthropic({ apiKey })

  const userMessage = selected
    ? `Current selection:
- Name: ${selected.name}
- NORAD ID: ${selected.norad_id}
- Inclination: ${selected.inclination.toFixed(2)}°
- Orbital period: ${selected.period.toFixed(1)} min
- TLE epoch: ${selected.epoch}

Question: ${question}`
    : question

  let answer: string
  let inputTokens = 0
  let outputTokens = 0

  try {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      temperature: TEMPERATURE,
      system: [
        {
          type: 'text',
          text: SYSTEM_PROMPT,
          cache_control: { type: 'ephemeral' },
        },
        {
          type: 'text',
          text: `Current UTC timestamp: ${new Date().toISOString()}`,
        },
      ],
      messages: [{ role: 'user', content: userMessage }],
    })

    inputTokens = response.usage.input_tokens
    outputTokens = response.usage.output_tokens
    const firstText = response.content.find((b) => b.type === 'text')
    answer = firstText && firstText.type === 'text' ? firstText.text.trim() : ''
    if (!answer) {
      return jsonResponse(
        { error: 'upstream_error', message: 'Model returned an empty response.' },
        502,
      )
    }
  } catch (err) {
    if (err instanceof Anthropic.RateLimitError) {
      return jsonResponse(
        { error: 'upstream_error', message: 'AI service is busy right now. Try again in a moment.' },
        429,
      )
    }
    if (err instanceof Anthropic.BadRequestError) {
      return jsonResponse(
        { error: 'invalid_question', message: 'Question was rejected by the model.' },
        400,
      )
    }
    console.error('[query] Anthropic error:', err)
    return jsonResponse(
      {
        error: 'upstream_error',
        message: err instanceof Error ? err.message : 'Unknown upstream error.',
      },
      502,
    )
  }

  // ---- record actual spend ----
  if (redis) {
    const cost =
      (inputTokens * INPUT_PRICE_PER_M) / 1_000_000 +
      (outputTokens * OUTPUT_PRICE_PER_M) / 1_000_000
    try {
      const budgetKey = `budget:${today}`
      await redis.incrbyfloat(budgetKey, cost)
      await redis.expire(budgetKey, ttl)
    } catch (err) {
      console.error('[query] Redis spend record failed:', err)
    }
  }

  return jsonResponse({ answer }, 200)
}

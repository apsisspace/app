/**
 * Vercel Edge Function: POST /api/query
 *
 * Claude-powered chat endpoint with live tool use. Claude can call four
 * server-executed tools (get_satellite_info, search_catalog, get_knowledge,
 * list_selected_satellite) via a bounded loop to ground answers in real
 * catalog + curated-knowledge data.
 *
 * Gates before we spend tokens:
 *   1. Per-IP daily cap  — 20 queries / IP / UTC day.
 *   2. Global daily cap  — $10 / UTC day across all users.
 *   3. Per-request cap   — $0.05; aborts mid-loop if exceeded.
 *
 * Error contract (JSON bodies):
 *   400 { error: 'invalid_question',      message }
 *   429 { error: 'daily_limit_reached',   message }
 *   503 { error: 'daily_budget_reached',  message }
 *   502 { error: 'upstream_error',        message }
 *   500 { error: 'internal_error',        message }
 *
 * Success:
 *   200 { answer, sources: [{ label, url? }, ...] }
 */

import Anthropic from '@anthropic-ai/sdk'
import type {
  MessageParam,
  ContentBlock,
  ToolUseBlock,
  ToolResultBlockParam,
} from '@anthropic-ai/sdk/resources/messages'
import { Redis } from '@upstash/redis'
import { TOOLS, runTool, type Source, type ToolRunState } from './_lib/tools'

export const config = { runtime: 'edge' }

// Haiku pricing ($ per 1M tokens).
const INPUT_PRICE_PER_M = 0.25
const OUTPUT_PRICE_PER_M = 1.25

const MODEL = 'claude-haiku-4-5-20251001'
const MAX_TOKENS = 400
const TEMPERATURE = 0.5
const MAX_TOOL_ITERATIONS = 5

const PER_IP_DAILY_LIMIT = 20
const GLOBAL_DAILY_BUDGET_USD = 10
const PER_REQUEST_BUDGET_USD = 0.05

// Pessimistic pre-flight estimate: one full input + output pass. Tool
// iterations add more, but the per-request cap catches runaway loops.
const WORST_CASE_USD =
  ((/* input  */ 1200 * INPUT_PRICE_PER_M) / 1_000_000) +
  ((/* output */ MAX_TOKENS * OUTPUT_PRICE_PER_M) / 1_000_000)

const MAX_QUESTION_CHARS = 500

const CORS_HEADERS: Record<string, string> = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'POST, OPTIONS',
  'access-control-allow-headers': 'content-type',
}

const SYSTEM_PROMPT = `You are Apsis, the AI assistant for Apsis Space — a browser-based satellite tracker.

Your role: help users understand what they're seeing. Answer plain-English questions about satellites, orbits, and the catalog. Be concrete and concise. Two to four short sentences is usually right; longer only when the question genuinely demands it.

Tone: knowledgeable, curious, a little playful — like a friendly expert hanging over the user's shoulder. Never stuffy. Never hedging with "I'm an AI" disclaimers.

Scope:
- Satellites, orbits, space operations, astronomy basics, Apsis Space itself.
- If asked something off-topic, redirect politely in one line.

Tools available to you:
- get_satellite_info(norad_id): live orbital data + SGP4-propagated position/velocity. Prefer this to reciting training data whenever the question is about a specific satellite's current state or catalog parameters.
- search_catalog(query, limit?): find NORAD IDs by substring match on name. Use this first when the user names a satellite ("Hubble", "Starlink 1007") instead of giving a NORAD ID.
- get_knowledge(norad_id | topic): curated markdown with cited sources, for well-known satellites or for topics like "geostationary-orbit", "sun-synchronous-orbit", "low-earth-orbit", "constellation", "orbital-decay". Returns null when we have no curated entry — if so, fall back to your own knowledge and say so.
- list_selected_satellite(): returns whatever satellite the user currently has selected in the UI (or null).

When the user says "this satellite" / "the selected one", start with list_selected_satellite. For a specific satellite, combine get_satellite_info with get_knowledge when available. Don't call tools when the question is purely conceptual and a curated topic entry exists — use get_knowledge(topic=...) directly.

Facts & accuracy:
- Trust tool results over memory. If a tool returns an error, try an alternative (e.g. search_catalog to resolve a name) or acknowledge the gap.
- If you answered entirely from training data, tell the user: "Based on general knowledge — click the satellite for live data."
- Do not claim live visibility predictions (we don't have the user's location/time).

Formatting:
- Plain text only. No markdown, no bullet lists, no headings, no code blocks, no emoji, no sign-offs.
- Do NOT write a "Sources:" section yourself — the server appends one automatically based on which tools returned data.`

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

function sanitizeQuestion(
  raw: unknown,
): { ok: true; value: string } | { ok: false; message: string } {
  if (typeof raw !== 'string') {
    return { ok: false, message: 'Question must be a string.' }
  }
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
  const inclination =
    typeof s.inclination === 'number' ? s.inclination : Number(s.inclination)
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

function computeCostUsd(inputTokens: number, outputTokens: number): number {
  return (
    (inputTokens * INPUT_PRICE_PER_M) / 1_000_000 +
    (outputTokens * OUTPUT_PRICE_PER_M) / 1_000_000
  )
}

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
      if (ipCount === 1) await redis.expire(ipKey, ttl)
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
      const spent =
        typeof spentRaw === 'number'
          ? spentRaw
          : parseFloat(String(spentRaw ?? '0')) || 0
      if (spent + WORST_CASE_USD > GLOBAL_DAILY_BUDGET_USD) {
        return jsonResponse(
          {
            error: 'daily_budget_reached',
            message: `Apsis has reached today's $${GLOBAL_DAILY_BUDGET_USD} AI budget. Try again after UTC midnight.`,
          },
          503,
        )
      }
    } catch (err) {
      console.error('[query] Redis error (failing open):', err)
    }
  }

  // ---- call Claude with tool use loop ----
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

  const messages: MessageParam[] = [{ role: 'user', content: userMessage }]

  const toolState: ToolRunState = {
    selected,
    sources: [],
  }

  let totalInputTokens = 0
  let totalOutputTokens = 0
  let answer = ''
  let stopReason: string | null = null
  let perRequestBudgetExceeded = false

  try {
    for (let iter = 0; iter < MAX_TOOL_ITERATIONS; iter++) {
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
        tools: TOOLS,
        messages,
      })

      totalInputTokens += response.usage.input_tokens
      totalOutputTokens += response.usage.output_tokens
      stopReason = response.stop_reason

      // Mid-loop per-request budget check.
      const runningCost = computeCostUsd(totalInputTokens, totalOutputTokens)
      if (runningCost > PER_REQUEST_BUDGET_USD) {
        perRequestBudgetExceeded = true
        break
      }

      if (response.stop_reason !== 'tool_use') {
        // Extract final text.
        const textBlock = response.content.find((b) => b.type === 'text')
        answer = textBlock && textBlock.type === 'text' ? textBlock.text.trim() : ''
        break
      }

      // Record the assistant's tool-use turn verbatim so the next call
      // carries the conversation correctly.
      messages.push({
        role: 'assistant',
        content: response.content as ContentBlock[],
      })

      const toolUses = response.content.filter(
        (b): b is ToolUseBlock => b.type === 'tool_use',
      )

      // Execute all tool_use blocks in parallel. Their results go into a
      // single user message as an array of tool_result blocks.
      const results: ToolResultBlockParam[] = await Promise.all(
        toolUses.map(async (tu) => {
          const result = await runTool(tu.name, tu.input, toolState)
          return {
            type: 'tool_result' as const,
            tool_use_id: tu.id,
            content: result.content,
            is_error: result.isError || undefined,
          }
        }),
      )
      messages.push({ role: 'user', content: results })
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

  const finalCost = computeCostUsd(totalInputTokens, totalOutputTokens)

  // ---- record actual spend + cost-log line ----
  if (redis) {
    try {
      const budgetKey = `budget:${today}`
      await redis.incrbyfloat(budgetKey, finalCost)
      await redis.expire(budgetKey, ttl)

      // Observability: per-request cost log with 7-day TTL.
      const logKey = `costlog:${today}:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`
      await redis.set(
        logKey,
        JSON.stringify({
          ts: new Date().toISOString(),
          ip,
          input: totalInputTokens,
          output: totalOutputTokens,
          cost_usd: finalCost,
          stop_reason: stopReason,
          tool_sources: toolState.sources.length,
          aborted: perRequestBudgetExceeded || undefined,
        }),
        { ex: 7 * 24 * 3600 },
      )
    } catch (err) {
      console.error('[query] Redis spend/log record failed:', err)
    }
  }

  if (perRequestBudgetExceeded) {
    return jsonResponse(
      {
        error: 'upstream_error',
        message:
          'This question went beyond the per-request cost cap. Try a narrower question.',
      },
      502,
    )
  }

  if (stopReason === 'tool_use') {
    // Ran out of iterations mid-loop.
    return jsonResponse(
      {
        error: 'upstream_error',
        message:
          'The AI ran out of tool-use steps. Try asking a more focused question.',
      },
      502,
    )
  }

  if (!answer) {
    return jsonResponse(
      { error: 'upstream_error', message: 'Model returned an empty response.' },
      502,
    )
  }

  const sources: Source[] = dedupeSources(toolState.sources)
  return jsonResponse({ answer, sources }, 200)
}

function dedupeSources(sources: Source[]): Source[] {
  const seen = new Set<string>()
  const out: Source[] = []
  for (const s of sources) {
    const key = s.url ?? s.label
    if (seen.has(key)) continue
    seen.add(key)
    out.push(s)
  }
  return out
}

/**
 * Tool layer for the Apsis AI chat. Declares the four tools Claude may
 * call, and implements server-side execution against live catalog data,
 * server-side SGP4 propagation, and the curated knowledge base.
 *
 * Every tool call is wrapped in a 3-second timeout. Tool failures return a
 * short human-readable string to Claude rather than throwing — the model
 * is instructed to explain gracefully when a tool can't complete.
 *
 * The executor also records `Source` entries for tools that yielded
 * real-world data, so the server can attach structured citations to the
 * final response.
 */

import type { Tool } from '@anthropic-ai/sdk/resources/messages'
import {
  getCatalog,
  findByNoradId,
  searchByName,
} from './catalog'
import { computeSatelliteInfo } from './propagate'
import {
  getKnowledgeByNoradId,
  getKnowledgeByTopic,
  type KnowledgeEntry,
} from '../../src/data/knowledge.generated'

const TOOL_TIMEOUT_MS = 3000

export interface SelectedSatelliteContext {
  norad_id: number
  name: string
  inclination: number
  period: number
  epoch: string
}

export interface Source {
  /** Human-readable label. Always present. */
  label: string
  /** Optional URL. Absent for "live data" citations. */
  url?: string
}

export interface ToolRunState {
  selected: SelectedSatelliteContext | null
  /** Sources accumulated across all successful tool calls this turn. */
  sources: Source[]
}

// ---------- tool declarations (Anthropic schema) ---------------------------

export const TOOLS: Tool[] = [
  {
    name: 'get_satellite_info',
    description:
      "Return rich orbital data for one satellite — name, NORAD ID, COSPAR (international) designator, inclination, eccentricity, period, apogee/perigee, mean motion, TLE epoch, and a live SGP4-propagated snapshot (altitude, velocity, latitude, longitude) evaluated at request time. Use this whenever the user asks what a satellite is doing now, where it is, how high it is, or for its orbital parameters. Returns an error string if the NORAD ID is not in the active catalog.",
    input_schema: {
      type: 'object',
      properties: {
        norad_id: {
          type: 'string',
          description:
            'NORAD catalog number as a string (e.g. "25544" for the ISS).',
        },
      },
      required: ['norad_id'],
    },
  },
  {
    name: 'search_catalog',
    description:
      'Case-insensitive substring search of satellite names in the active catalog. Use this when the user refers to a satellite by name instead of by NORAD ID. Returns up to `limit` matches (default 10), each with its NORAD ID and catalog name.',
    input_schema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Substring to match against satellite names.',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of results (default 10, max 25).',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'get_knowledge',
    description:
      'Fetch Apsis Space\'s curated knowledge entry for a specific satellite (by NORAD ID) or a general orbital-mechanics topic (by kebab-case slug such as "geostationary-orbit", "sun-synchronous-orbit", "low-earth-orbit", "constellation", "orbital-decay"). Returns the entry\'s markdown body plus source URLs. Returns null if no curated entry exists — in that case you should answer from general knowledge and say so.',
    input_schema: {
      type: 'object',
      properties: {
        norad_id: {
          type: 'string',
          description: 'NORAD catalog number as a string.',
        },
        topic: {
          type: 'string',
          description:
            'Topic slug in kebab-case. Exactly one of norad_id or topic must be supplied.',
        },
      },
    },
  },
  {
    name: 'list_selected_satellite',
    description:
      'Return metadata for the satellite the user currently has selected in the Apsis Space UI, or null if nothing is selected. Use this when the user says "this satellite", "the selected one", or similar.',
    input_schema: { type: 'object', properties: {} },
  },
]

// ---------- executor -------------------------------------------------------

function withTimeout<T>(p: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`${label} timed out after ${ms} ms`))
    }, ms)
    p.then(
      (v) => {
        clearTimeout(timer)
        resolve(v)
      },
      (e) => {
        clearTimeout(timer)
        reject(e)
      },
    )
  })
}

function parseNoradIdArg(raw: unknown): number | null {
  if (typeof raw === 'number' && Number.isInteger(raw)) return raw
  if (typeof raw === 'string') {
    const n = parseInt(raw.trim(), 10)
    if (Number.isFinite(n) && n > 0) return n
  }
  return null
}

function addKnowledgeSources(entry: KnowledgeEntry, state: ToolRunState) {
  for (const s of entry.sources) {
    if (!state.sources.some((existing) => existing.url === s.url)) {
      state.sources.push({ label: s.title, url: s.url })
    }
  }
}

function addLiveDataSource(epochISO: string, state: ToolRunState) {
  const label = `Live orbital data from Apsis Space catalog (TLE epoch: ${epochISO.slice(0, 10)})`
  if (!state.sources.some((s) => s.label === label)) {
    state.sources.push({ label })
  }
}

async function runGetSatelliteInfo(
  input: Record<string, unknown>,
  state: ToolRunState,
): Promise<string> {
  const id = parseNoradIdArg(input.norad_id)
  if (id == null) {
    return 'Error: norad_id must be a positive integer (as a string).'
  }
  const catalog = await getCatalog()
  const tle = findByNoradId(catalog, id)
  if (!tle) {
    return `Error: Satellite ${id} not found in the active catalog.`
  }
  const info = computeSatelliteInfo(tle, new Date())
  if (!info) {
    return `Error: SGP4 propagation failed for ${tle.name} (${id}); it may have decayed or carry a bad TLE.`
  }
  addLiveDataSource(info.tleEpochISO, state)
  return JSON.stringify({
    name: info.name,
    norad_id: info.noradId,
    cospar_id: info.cosparId,
    inclination_deg: Number(info.inclinationDeg.toFixed(3)),
    eccentricity: Number(info.eccentricity.toFixed(6)),
    period_min: Number(info.periodMinutes.toFixed(2)),
    apogee_km: Number(info.apogeeKm.toFixed(1)),
    perigee_km: Number(info.perigeeKm.toFixed(1)),
    mean_motion_rev_per_day: Number(info.meanMotionRevPerDay.toFixed(6)),
    tle_epoch: info.tleEpochISO,
    current_altitude_km: Number(info.currentAltitudeKm.toFixed(1)),
    current_velocity_km_s: Number(info.currentVelocityKmS.toFixed(3)),
    current_latitude_deg: Number(info.currentLatitudeDeg.toFixed(3)),
    current_longitude_deg: Number(info.currentLongitudeDeg.toFixed(3)),
    sampled_at: info.sampledAtISO,
  })
}

async function runSearchCatalog(
  input: Record<string, unknown>,
): Promise<string> {
  const q = typeof input.query === 'string' ? input.query : ''
  if (!q.trim()) return 'Error: query must be a non-empty string.'
  let limit = 10
  if (typeof input.limit === 'number' && Number.isFinite(input.limit)) {
    limit = Math.max(1, Math.min(25, Math.floor(input.limit)))
  }
  const catalog = await getCatalog()
  const hits = searchByName(catalog, q, limit)
  if (hits.length === 0) {
    return JSON.stringify({ matches: [], note: `No catalog entries match "${q}".` })
  }
  return JSON.stringify({
    matches: hits.map((t) => ({ norad_id: t.noradId, name: t.name })),
  })
}

function runGetKnowledge(
  input: Record<string, unknown>,
  state: ToolRunState,
): string {
  const hasNorad = input.norad_id != null && String(input.norad_id).trim() !== ''
  const hasTopic = typeof input.topic === 'string' && input.topic.trim() !== ''
  if (hasNorad === hasTopic) {
    return 'Error: supply exactly one of norad_id or topic.'
  }
  let entry: KnowledgeEntry | null = null
  if (hasNorad) {
    const id = parseNoradIdArg(input.norad_id)
    if (id == null) return 'Error: norad_id must be a positive integer.'
    entry = getKnowledgeByNoradId(id)
  } else {
    entry = getKnowledgeByTopic(String(input.topic))
  }
  if (!entry) {
    return JSON.stringify({
      entry: null,
      note: 'No curated knowledge entry for this query.',
    })
  }
  addKnowledgeSources(entry, state)
  return JSON.stringify({
    entry: {
      name: entry.name,
      aliases: entry.aliases,
      norad_id: entry.noradId ?? null,
      topic: entry.topic ?? null,
      body: entry.body,
      sources: entry.sources,
    },
  })
}

function runListSelectedSatellite(state: ToolRunState): string {
  if (!state.selected) {
    return JSON.stringify({ selected: null })
  }
  const s = state.selected
  return JSON.stringify({
    selected: {
      norad_id: s.norad_id,
      name: s.name,
      inclination_deg: s.inclination,
      period_min: s.period,
      tle_epoch: s.epoch,
    },
  })
}

export interface ToolResult {
  toolName: string
  content: string
  isError: boolean
}

/**
 * Dispatch a single tool_use block. Guarantees timeouts and never throws —
 * errors are converted to an error string the model can reason about.
 */
export async function runTool(
  name: string,
  input: unknown,
  state: ToolRunState,
): Promise<ToolResult> {
  const args = (input && typeof input === 'object' ? input : {}) as Record<
    string,
    unknown
  >
  try {
    let content: string
    switch (name) {
      case 'get_satellite_info':
        content = await withTimeout(
          runGetSatelliteInfo(args, state),
          TOOL_TIMEOUT_MS,
          name,
        )
        break
      case 'search_catalog':
        content = await withTimeout(
          runSearchCatalog(args),
          TOOL_TIMEOUT_MS,
          name,
        )
        break
      case 'get_knowledge':
        content = runGetKnowledge(args, state)
        break
      case 'list_selected_satellite':
        content = runListSelectedSatellite(state)
        break
      default:
        return {
          toolName: name,
          content: `Error: unknown tool "${name}".`,
          isError: true,
        }
    }
    const isError = content.startsWith('Error:')
    return { toolName: name, content, isError }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return {
      toolName: name,
      content: `Error: ${message}`,
      isError: true,
    }
  }
}

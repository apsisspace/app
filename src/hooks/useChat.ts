/**
 * Chat state + submit logic for the Apsis AI layer.
 *
 * Messages are kept in local component state (ephemeral — cleared on
 * reload). Selection context is pulled from the Zustand store
 * imperatively inside `sendMessage` so chat submit doesn't re-render on
 * every selection change.
 *
 * TODO(persist): Later, persist chat history to localStorage.
 */

import { useCallback, useRef, useState } from 'react'
import { useSelectionStore } from '../stores/selection'
import { tleMetadata } from '../lib/tleMetadata'
import type { Satellite } from '../types/satellite'
import type {
  ChatApiError,
  ChatContext,
  ChatErrorKind,
  ChatMessage,
  ChatSource,
} from '../types/chat'

const API_URL = '/api/query'
const MAX_QUESTION_CHARS = 500

export { MAX_QUESTION_CHARS }

interface UseChatOptions {
  /** The loaded satellite catalog — used to build selection context. */
  catalog: Satellite[] | undefined
}

interface UseChatResult {
  messages: ChatMessage[]
  isSending: boolean
  sendMessage: (question: string) => Promise<void>
  clear: () => void
}

function nextId(): string {
  // Collision probability is irrelevant at our scale.
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
}

function buildContext(catalog: Satellite[] | undefined): ChatContext | undefined {
  if (!catalog) return undefined
  const selectedNoradId = useSelectionStore.getState().selectedNoradId
  if (selectedNoradId == null) return undefined
  const sat = catalog.find((s) => s.tle.noradId === selectedNoradId)
  if (!sat) return undefined
  const meta = tleMetadata(sat.tle)
  return {
    selectedSatellite: {
      norad_id: sat.tle.noradId,
      name: sat.tle.name,
      inclination: Number.isFinite(meta.inclinationDeg) ? meta.inclinationDeg : 0,
      period: Number.isFinite(meta.periodMinutes) ? meta.periodMinutes : 0,
      epoch: Number.isFinite(meta.epoch.getTime())
        ? meta.epoch.toISOString()
        : '',
    },
  }
}

function parseSources(raw: unknown): ChatSource[] | undefined {
  if (!Array.isArray(raw) || raw.length === 0) return undefined
  const out: ChatSource[] = []
  for (const s of raw) {
    if (!s || typeof s !== 'object') continue
    const r = s as { label?: unknown; url?: unknown }
    if (typeof r.label !== 'string' || r.label.trim() === '') continue
    const entry: ChatSource = { label: r.label }
    if (typeof r.url === 'string' && r.url.trim() !== '') entry.url = r.url
    out.push(entry)
  }
  return out.length > 0 ? out : undefined
}

function validateQuestion(q: string): string | null {
  const trimmed = q.trim()
  if (trimmed.length === 0) return 'Question cannot be empty.'
  if (trimmed.length > MAX_QUESTION_CHARS) {
    return `Question must be ${MAX_QUESTION_CHARS} characters or fewer.`
  }
  return null
}

export function useChat({ catalog }: UseChatOptions): UseChatResult {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isSending, setIsSending] = useState(false)
  const inFlight = useRef(false)

  const sendMessage = useCallback(
    async (question: string): Promise<void> => {
      if (inFlight.current) return

      const validationErr = validateQuestion(question)
      const userMsg: ChatMessage = {
        id: nextId(),
        role: 'user',
        content: question.trim(),
        createdAt: Date.now(),
      }

      if (validationErr) {
        setMessages((prev) => [
          ...prev,
          userMsg,
          {
            id: nextId(),
            role: 'assistant',
            content: validationErr,
            createdAt: Date.now(),
            errorKind: 'invalid_question',
          },
        ])
        return
      }

      inFlight.current = true
      setIsSending(true)
      setMessages((prev) => [...prev, userMsg])

      try {
        const res = await fetch(API_URL, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            question: userMsg.content,
            context: buildContext(catalog),
          }),
        })

        let payload: unknown = null
        try {
          payload = await res.json()
        } catch {
          // Non-JSON response; fall through to generic error.
        }

        if (!res.ok) {
          const errPayload = payload as Partial<ChatApiError> | null
          const kind: ChatErrorKind =
            (errPayload?.error as ChatErrorKind | undefined) ?? 'upstream_error'
          const message =
            errPayload?.message ??
            'The AI service returned an error. Please try again.'
          setMessages((prev) => [
            ...prev,
            {
              id: nextId(),
              role: 'assistant',
              content: message,
              createdAt: Date.now(),
              errorKind: kind,
            },
          ])
          return
        }

        const ok = payload as { answer?: string; sources?: unknown } | null
        const answer = typeof ok?.answer === 'string' ? ok.answer : ''
        if (!answer) {
          setMessages((prev) => [
            ...prev,
            {
              id: nextId(),
              role: 'assistant',
              content: 'Empty response from the AI service.',
              createdAt: Date.now(),
              errorKind: 'upstream_error',
            },
          ])
          return
        }

        setMessages((prev) => [
          ...prev,
          {
            id: nextId(),
            role: 'assistant',
            content: answer,
            createdAt: Date.now(),
            sources: parseSources(ok?.sources),
          },
        ])
      } catch (err) {
        setMessages((prev) => [
          ...prev,
          {
            id: nextId(),
            role: 'assistant',
            content:
              err instanceof Error
                ? `Couldn't reach the AI service: ${err.message}`
                : "Couldn't reach the AI service.",
            createdAt: Date.now(),
            errorKind: 'network',
          },
        ])
      } finally {
        inFlight.current = false
        setIsSending(false)
      }
    },
    [catalog],
  )

  const clear = useCallback(() => {
    setMessages([])
  }, [])

  return { messages, isSending, sendMessage, clear }
}

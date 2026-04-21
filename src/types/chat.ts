/**
 * Chat message + error types for the Apsis AI query layer.
 *
 * Messages are ephemeral: they live in component state and are cleared on
 * page reload. If we later persist, we'll lift this into a store — the
 * shape is already persistable (IDs + timestamps).
 *
 * TODO(persist): Later, persist chat history to localStorage.
 */

export type ChatRole = 'user' | 'assistant'

export interface ChatMessage {
  id: string
  role: ChatRole
  content: string
  /** Epoch millis. */
  createdAt: number
  /**
   * If this assistant message is actually an error, the category tells the
   * UI how to render it (distinct colors / copy). Undefined for a normal
   * assistant reply or any user message.
   */
  errorKind?: ChatErrorKind
  /**
   * Citations attached by the server based on which tools returned data.
   * Undefined / empty means the AI answered from training data only.
   */
  sources?: ChatSource[]
}

/** One citation line rendered under the assistant's answer. */
export interface ChatSource {
  /** Human-readable label. Always present. */
  label: string
  /** Optional URL — absent for "live data" citations. */
  url?: string
}

/** Discrete error categories the UI can render differently. */
export type ChatErrorKind =
  | 'invalid_question'
  | 'daily_limit_reached'
  | 'daily_budget_reached'
  | 'network'
  | 'upstream_error'
  | 'internal_error'

/** Server error payload shape from /api/query. */
export interface ChatApiError {
  error: ChatErrorKind
  message: string
}

/** Per-turn context shipped to the server. */
export interface ChatContext {
  selectedSatellite?: {
    norad_id: number
    name: string
    inclination: number
    period: number
    epoch: string
  }
}

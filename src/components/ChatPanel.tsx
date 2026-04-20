/**
 * Bottom-right chat panel. Collapsed by default as a small teal button;
 * expanded it's a ~400×500 panel with scrollable history, typing
 * indicator, distinct error pills, and a 500-char input with counter.
 *
 * Chat state and the fetch to /api/query live in useChat. This file is
 * purely presentational — it never touches Cesium or the selection
 * store, so its re-renders cannot cause the globe to re-render.
 */

import { useEffect, useRef, useState } from 'react'
import type { Satellite } from '../types/satellite'
import { useChat, MAX_QUESTION_CHARS } from '../hooks/useChat'
import { useSelectedNoradId } from '../hooks/useSelectedSatellite'
import type { ChatMessage, ChatErrorKind } from '../types/chat'
import { useUIStore } from '../stores/ui'

interface ChatPanelProps {
  catalog: Satellite[] | undefined
}

const SUGGESTIONS = [
  'What is a sun-synchronous orbit?',
  'How high is the ISS?',
  'What is a TLE?',
]

export function ChatPanel({ catalog }: ChatPanelProps) {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState('')
  const { messages, isSending, sendMessage } = useChat({ catalog })
  const selectedNoradId = useSelectedNoradId()

  // Only read the name when we actually need it, cheaply — resolved here
  // because catalog+id already flow into this component.
  const selectedName =
    catalog && selectedNoradId != null
      ? (catalog.find((s) => s.tle.noradId === selectedNoradId)?.tle.name ?? null)
      : null

  const listRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const el = listRef.current
    if (!el) return
    el.scrollTop = el.scrollHeight
  }, [messages, isSending, open])

  const remaining = MAX_QUESTION_CHARS - draft.length
  const canSubmit = !isSending && draft.trim().length > 0 && draft.length <= MAX_QUESTION_CHARS

  function submit(text?: string) {
    const value = (text ?? draft).trim()
    if (!value || isSending) return
    setDraft('')
    useUIStore.getState().markInteracted()
    void sendMessage(value)
  }

  if (!open) {
    return (
      <div className="pointer-events-auto absolute bottom-4 right-4">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="cursor-pointer border border-[#00d4ff]/40 bg-[#0a0a0a]/95 px-4 py-2 font-mono text-xs uppercase tracking-widest text-[#00d4ff] hover:border-[#00d4ff] hover:bg-[#00d4ff]/10"
          aria-label="Open Apsis AI chat"
        >
          ask apsis
        </button>
      </div>
    )
  }

  return (
    <div className="pointer-events-auto absolute bottom-4 right-4 flex h-[500px] w-[400px] flex-col border border-white/10 bg-[#0a0a0a]/95 font-mono text-xs text-white/85">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-white/10 px-3 py-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold tracking-[0.2em] uppercase text-[#00d4ff]">
            Apsis AI
          </span>
          <span className="text-[10px] uppercase tracking-widest text-white/40">
            beta
          </span>
        </div>
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Close chat"
          className="cursor-pointer text-white/50 hover:text-white"
        >
          ×
        </button>
      </header>

      {/* Message list */}
      <div
        ref={listRef}
        className="flex-1 space-y-3 overflow-y-auto px-3 py-3"
      >
        {messages.length === 0 ? (
          <EmptyState
            selectedName={selectedName}
            onPick={(q) => submit(q)}
          />
        ) : (
          messages.map((m) => <MessageBubble key={m.id} message={m} />)
        )}
        {isSending && <TypingIndicator />}
      </div>

      {/* Composer */}
      <form
        onSubmit={(e) => {
          e.preventDefault()
          submit()
        }}
        className="border-t border-white/10 px-3 py-2"
      >
        <div className="flex items-end gap-2">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value.slice(0, MAX_QUESTION_CHARS))}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                submit()
              }
            }}
            placeholder={
              selectedName
                ? `Ask about ${selectedName}...`
                : 'Ask about satellites, orbits, the sky...'
            }
            rows={2}
            className="flex-1 resize-none border border-white/10 bg-black/60 px-2 py-1.5 text-white placeholder-white/30 outline-none focus:border-[#00d4ff]/60"
          />
          <button
            type="submit"
            disabled={!canSubmit}
            className="cursor-pointer border border-[#00d4ff]/40 px-3 py-1.5 uppercase tracking-widest text-[#00d4ff] hover:border-[#00d4ff] hover:bg-[#00d4ff]/10 disabled:cursor-not-allowed disabled:border-white/10 disabled:text-white/30 disabled:hover:bg-transparent"
          >
            send
          </button>
        </div>
        <div className="mt-1 flex justify-end text-[10px] text-white/30">
          <span className={remaining < 50 ? 'text-[#00d4ff]' : ''}>
            {remaining}
          </span>
        </div>
      </form>
    </div>
  )
}

function EmptyState({
  selectedName,
  onPick,
}: {
  selectedName: string | null
  onPick: (q: string) => void
}) {
  const pills = selectedName
    ? [`Tell me about ${selectedName}.`, ...SUGGESTIONS]
    : SUGGESTIONS

  return (
    <div className="flex h-full flex-col items-start justify-center gap-3 text-white/60">
      <p className="text-[10px] uppercase tracking-widest text-white/40">
        Ask anything about satellites
      </p>
      <div className="flex flex-wrap gap-1.5">
        {pills.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => onPick(p)}
            className="cursor-pointer border border-white/10 bg-white/5 px-2 py-1 text-left text-white/70 hover:border-[#00d4ff]/40 hover:text-[#00d4ff]"
          >
            {p}
          </button>
        ))}
      </div>
    </div>
  )
}

function MessageBubble({ message }: { message: ChatMessage }) {
  if (message.role === 'user') {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] border border-[#00d4ff]/30 bg-[#00d4ff]/10 px-2.5 py-1.5 text-white/90 whitespace-pre-wrap">
          {message.content}
        </div>
      </div>
    )
  }

  if (message.errorKind) {
    return <ErrorBubble kind={message.errorKind} message={message.content} />
  }

  return (
    <div className="flex">
      <div className="max-w-[85%] border border-white/10 bg-white/[0.03] px-2.5 py-1.5 text-white/85 whitespace-pre-wrap">
        {message.content}
      </div>
    </div>
  )
}

const ERROR_STYLES: Record<ChatErrorKind, { border: string; label: string }> = {
  invalid_question: { border: 'border-white/20', label: 'Invalid question' },
  daily_limit_reached: { border: 'border-amber-400/40', label: 'Daily limit reached' },
  daily_budget_reached: { border: 'border-amber-400/40', label: 'Budget reached' },
  network: { border: 'border-red-400/40', label: 'Network error' },
  upstream_error: { border: 'border-red-400/40', label: 'Service error' },
  internal_error: { border: 'border-red-400/40', label: 'Internal error' },
}

function ErrorBubble({ kind, message }: { kind: ChatErrorKind; message: string }) {
  const style = ERROR_STYLES[kind]
  return (
    <div className="flex">
      <div
        className={`max-w-[85%] border ${style.border} bg-white/[0.02] px-2.5 py-1.5`}
      >
        <div className="text-[10px] uppercase tracking-widest text-white/50">
          {style.label}
        </div>
        <div className="mt-0.5 text-white/80 whitespace-pre-wrap">{message}</div>
      </div>
    </div>
  )
}

function TypingIndicator() {
  return (
    <div className="flex">
      <div className="border border-white/10 bg-white/[0.03] px-2.5 py-1.5 text-white/50">
        <span className="inline-flex gap-1">
          <Dot delay="0s" />
          <Dot delay="0.15s" />
          <Dot delay="0.3s" />
        </span>
      </div>
    </div>
  )
}

function Dot({ delay }: { delay: string }) {
  return (
    <span
      className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#00d4ff]/70"
      style={{ animationDelay: delay }}
    />
  )
}

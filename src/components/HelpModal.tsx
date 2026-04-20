/**
 * About / help modal. Plain-text explanation of what Apsis Space is +
 * a link out to the landing page. Dismiss with the × button, Escape, or
 * click-outside.
 */

import { useEffect } from 'react'
import { useUIStore } from '../stores/ui'

export function HelpModal() {
  const open = useUIStore((s) => s.helpOpen)
  const setHelpOpen = useUIStore((s) => s.setHelpOpen)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setHelpOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, setHelpOpen])

  if (!open) return null

  return (
    <div
      className="pointer-events-auto fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 font-mono text-white"
      onClick={() => setHelpOpen(false)}
      role="dialog"
      aria-modal="true"
      aria-label="About Apsis Space"
    >
      <div
        className="w-full max-w-md border border-white/15 bg-[#0a0a0a] p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-start justify-between gap-2">
          <h2 className="text-sm font-semibold tracking-[0.2em] uppercase text-[#00d4ff]">
            Apsis Space
          </h2>
          <button
            type="button"
            onClick={() => setHelpOpen(false)}
            aria-label="Close"
            className="cursor-pointer text-white/50 hover:text-white"
          >
            ×
          </button>
        </header>

        <div className="mt-3 space-y-3 text-xs leading-relaxed text-white/80">
          <p>
            A live map of roughly 10,000 active satellites. Positions are
            propagated in your browser from TLEs served through Celestrak —
            nothing is pre-rendered.
          </p>
          <p>
            Points are colored by orbital inclination. Click any satellite to
            see its altitude, velocity, orbit, and the next time it's
            visible from your location. Ask Apsis (bottom right) can answer
            plain-English questions about what you're looking at.
          </p>
          <p className="text-white/50">
            Keyboard: <span className="text-white/70">Esc</span> closes panels.
            Click empty space to deselect.
          </p>
        </div>

        <footer className="mt-4 border-t border-white/10 pt-3 text-[10px] uppercase tracking-widest text-white/40">
          <a
            href="https://apsisspace.com"
            target="_blank"
            rel="noreferrer"
            className="text-[#00d4ff] hover:underline"
          >
            apsisspace.com
          </a>
        </footer>
      </div>
    </div>
  )
}

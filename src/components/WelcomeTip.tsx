/**
 * A small fade-out tip near the bottom of the viewport that nudges
 * first-time users toward interaction. Disappears as soon as they pick
 * a satellite or open chat (tracked via `hasInteracted` in the UI store).
 */

import { useUIStore } from '../stores/ui'

export function WelcomeTip() {
  const hasInteracted = useUIStore((s) => s.hasInteracted)

  return (
    <div
      className={
        'pointer-events-none absolute bottom-16 left-1/2 -translate-x-1/2 transform select-none font-mono text-[11px] uppercase tracking-widest text-white/50 transition-opacity duration-700 ' +
        (hasInteracted ? 'opacity-0' : 'opacity-100')
      }
      aria-hidden={hasInteracted}
    >
      Click any satellite, or ask Apsis
    </div>
  )
}

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
        // bottom-20 on mobile clears the 44px-target toolbar + safe area margin.
        // bottom-16 restores the original desktop spacing.
        'pointer-events-none absolute bottom-20 left-1/2 -translate-x-1/2 transform select-none font-mono text-[11px] uppercase tracking-widest text-white/50 transition-opacity duration-700 md:bottom-16 ' +
        (hasInteracted ? 'opacity-0' : 'opacity-100')
      }
      aria-hidden={hasInteracted}
    >
      Click any satellite, or ask Apsis
    </div>
  )
}

/**
 * UI-chrome state: Earth mode, legend visibility, help modal, first-run
 * tip. Kept separate from selection/observer so components that only care
 * about UI chrome don't re-render on selection changes.
 */

import { create } from 'zustand'

export type EarthMode = 'full' | 'minimal' | 'night'

interface UIState {
  earthMode: EarthMode
  legendOpen: boolean
  helpOpen: boolean
  /**
   * True once the user has picked a satellite or interacted with chat.
   * The welcome tip listens to this to fade itself out.
   */
  hasInteracted: boolean
  chatOpen: boolean

  cycleEarthMode: () => void
  setEarthMode: (m: EarthMode) => void
  toggleLegend: () => void
  setLegendOpen: (open: boolean) => void
  setHelpOpen: (open: boolean) => void
  markInteracted: () => void
  setChatOpen: (open: boolean | ((prev: boolean) => boolean)) => void
}

const EARTH_MODE_ORDER: readonly EarthMode[] = ['minimal', 'full', 'night']

export const useUIStore = create<UIState>((set, get) => ({
  earthMode: 'minimal',
  legendOpen: false,
  helpOpen: false,
  hasInteracted: false,
  chatOpen: false,

  cycleEarthMode: () => {
    const cur = get().earthMode
    const idx = EARTH_MODE_ORDER.indexOf(cur)
    const next = EARTH_MODE_ORDER[(idx + 1) % EARTH_MODE_ORDER.length]
    set({ earthMode: next })
  },
  setEarthMode: (earthMode) => set({ earthMode }),
  toggleLegend: () => set((s) => ({ legendOpen: !s.legendOpen })),
  setLegendOpen: (legendOpen) => set({ legendOpen }),
  setHelpOpen: (helpOpen) => set({ helpOpen }),
  setChatOpen: (updater) => set((state) => ({ chatOpen: typeof updater === 'function' ? updater(state.chatOpen) : updater })),
  markInteracted: () => {
    if (!get().hasInteracted) set({ hasInteracted: true })
  },
}))

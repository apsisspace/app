/**
 * Zustand store for the currently selected satellite.
 *
 * The imperative Cesium layer subscribes with `useSelectionStore.subscribe(...)`
 * so it can update point colors/sizes without a React re-render per frame.
 * UI components that need to react to selection (side panel) use the
 * `useSelection*` hooks below.
 */

import { create } from 'zustand'

interface SelectionState {
  selectedNoradId: number | null
  select: (noradId: number | null) => void
  clear: () => void
}

export const useSelectionStore = create<SelectionState>((set) => ({
  selectedNoradId: null,
  select: (noradId) => set({ selectedNoradId: noradId }),
  clear: () => set({ selectedNoradId: null }),
}))

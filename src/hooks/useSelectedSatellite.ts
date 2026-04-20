/**
 * React hook exposing the currently selected satellite (if any).
 *
 * Only re-renders when the selection changes — unrelated state in the
 * Zustand store won't trigger component updates here.
 */

import { useSelectionStore } from '../stores/selection'
import type { Satellite } from '../types/satellite'

export function useSelectedNoradId(): number | null {
  return useSelectionStore((s) => s.selectedNoradId)
}

export function useSelectionActions() {
  const select = useSelectionStore((s) => s.select)
  const clear = useSelectionStore((s) => s.clear)
  return { select, clear }
}

/** Resolve the currently-selected satellite in a given catalog, or null. */
export function findSelected(
  catalog: Satellite[],
  selectedNoradId: number | null,
): Satellite | null {
  if (selectedNoradId == null) return null
  return catalog.find((s) => s.tle.noradId === selectedNoradId) ?? null
}

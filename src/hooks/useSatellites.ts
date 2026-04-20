/**
 * TanStack Query hooks for fetching satellite TLE data.
 *
 * Kept deliberately small for v1 — just the ISS. The shape returns an array
 * so the rendering layer doesn't care how many satellites there are.
 */

import { useQuery } from '@tanstack/react-query'
import { fetchTLEByCatalogNumber, ISS_NORAD_ID } from '../lib/celestrak'
import type { Satellite } from '../types/satellite'

/** Fetch the ISS TLE, wrapped as a one-element Satellite[]. */
export function useISS() {
  return useQuery<Satellite[]>({
    queryKey: ['tle', 'iss', ISS_NORAD_ID],
    queryFn: async () => {
      const tle = await fetchTLEByCatalogNumber(ISS_NORAD_ID)
      return [{ tle, color: '#ff3366' }]
    },
  })
}

// TODO(full-catalog): Add useSatelliteGroup(group) backed by fetchTLEGroup
//   and cached per-group with a longer staleTime.

/**
 * TanStack Query hook that fetches Celestrak's active satellite catalog.
 *
 * Caching: 6h staleTime matches our TLE refresh cadence in main.tsx.
 * The catalog is ~10k entries; re-parse cost is minor but we still cache.
 */

import { useQuery } from '@tanstack/react-query'
import { fetchActiveTLEs } from '../lib/celestrak'
import type { Satellite } from '../types/satellite'

export function useSatelliteCatalog() {
  return useQuery<Satellite[]>({
    queryKey: ['tle', 'group', 'active'],
    queryFn: async () => {
      const tles = await fetchActiveTLEs()
      return tles.map((tle) => ({ tle }))
    },
  })
}

/**
 * Observer-location store. Powers the side panel's "Next pass over you"
 * feature.
 *
 * Privacy: location is kept in memory only — never persisted, never sent to
 * our server. The user has to grant the browser permission each session.
 */

import { create } from 'zustand'
import type { Observer } from '../lib/passPrediction'

export type GeoStatus =
  | 'idle'
  | 'requesting'
  | 'granted'
  | 'denied'
  | 'unsupported'
  | 'error'

interface ObserverState {
  status: GeoStatus
  observer: Observer | null
  /** Human-readable error message, when status === 'error'. */
  errorMessage: string | null
  request: () => void
  clear: () => void
}

export const useObserverStore = create<ObserverState>((set, get) => ({
  status: 'idle',
  observer: null,
  errorMessage: null,

  request: () => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      set({ status: 'unsupported', errorMessage: 'Geolocation not supported.' })
      return
    }
    if (get().status === 'requesting') return

    set({ status: 'requesting', errorMessage: null })
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        set({
          status: 'granted',
          observer: {
            lat: pos.coords.latitude,
            lon: pos.coords.longitude,
            heightKm: (pos.coords.altitude ?? 0) / 1000,
          },
          errorMessage: null,
        })
      },
      (err) => {
        const denied = err.code === err.PERMISSION_DENIED
        set({
          status: denied ? 'denied' : 'error',
          observer: null,
          errorMessage: err.message,
        })
      },
      { timeout: 10_000, maximumAge: 60_000 },
    )
  },

  clear: () => set({ status: 'idle', observer: null, errorMessage: null }),
}))

import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'wouter'
import { ChatPanel } from './components/ChatPanel'
import { Globe } from './components/Globe'
import { HelpModal } from './components/HelpModal'
import { Legend } from './components/Legend'
import { SatelliteLayer } from './components/SatelliteLayer'
import { SearchBar } from './components/SearchBar'
import { SidePanel } from './components/SidePanel'
import { Toolbar } from './components/Toolbar'
import { WelcomeTip } from './components/WelcomeTip'
import { useSatelliteCatalog } from './hooks/useSatelliteCatalog'
import {
  useSelectedNoradId,
  findSelected,
} from './hooks/useSelectedSatellite'
import { useSelectionStore } from './stores/selection'
import { useUIStore } from './stores/ui'

// TODO(auth): Add user accounts and pro tier gating.

function App() {
  const { data: catalog, isPending, failureCount, refetch } = useSatelliteCatalog()
  const selectedNoradId = useSelectedNoradId()
  const selected = catalog ? findSelected(catalog, selectedNoradId) : null

  const [showLoading, setShowLoading] = useState(true)
  const [fadingOut, setFadingOut] = useState(false)

  // First-run welcome tip fades out on the user's first meaningful action.
  // We subscribe once; zustand guarantees the unsubscribe cleanup path.
  useEffect(() => {
    const mark = useUIStore.getState().markInteracted
    const unsub = useSelectionStore.subscribe((s, prev) => {
      if (s.selectedNoradId !== prev.selectedNoradId && s.selectedNoradId != null) {
        mark()
      }
    })
    return unsub
  }, [])

  // --- URL ↔ selection sync -------------------------------------------
  // The root route lives at "/". When the user clicks a satellite we push
  // /satellite/:noradId into history so the URL is shareable. When they
  // close the panel (selection → null), we push "/" back.
  //
  // The tricky case is a cold load of /satellite/:id. App's effects run
  // BEFORE SatelliteRoute's effects (children first), so we see
  // selectedNoradId=null while the URL already says /satellite/25544.
  // A naive sync would preemptively navigate(`/`) and SatelliteRoute
  // would never get its turn. The ref below tracks whether we've ever
  // observed a non-null selection — before that happens, a null
  // selection on a /satellite/ URL is interpreted as "route is still
  // initializing" and we leave the URL alone. After the first real
  // selection we accept null as "user closed the panel" and navigate.
  const [location, navigate] = useLocation()
  const hasSelectionEverSet = useRef(false)
  useEffect(() => {
    if (selectedNoradId != null) hasSelectionEverSet.current = true

    if (
      !hasSelectionEverSet.current &&
      selectedNoradId == null &&
      location.startsWith('/satellite/')
    ) {
      return
    }

    const expected =
      selectedNoradId != null ? `/satellite/${selectedNoradId}` : '/'
    if (location !== expected) {
      navigate(expected)
    }
  }, [selectedNoradId, location, navigate])

  // Kick off the fade-out the moment the catalog arrives. Depending only on
  // `catalog` keeps this effect from re-running when `fadingOut` flips —
  // earlier versions had `fadingOut` in the deps, which caused the cleanup
  // to clearTimeout the 300ms unmount timer before it could fire, leaving
  // the overlay in the DOM at opacity-0 but with pointer-events-auto.
  useEffect(() => {
    if (!catalog) return
    setFadingOut(true)
    const timer = setTimeout(() => {
      setShowLoading(false)
    }, 300)
    return () => clearTimeout(timer)
  }, [catalog])

  // We retry indefinitely, so the query never settles into a terminal error
  // state. failureCount lets us distinguish first load vs. stuck retrying.
  let statusText: string | null = null
  if (catalog) {
    statusText = `${catalog.length.toLocaleString()} satellites`
  }

  return (
    <div className="relative h-full w-full">
      <Globe>
        {catalog && <SatelliteLayer satellites={catalog} />}
      </Globe>

      {/* Top-left brand mark — deliberately small, not a dominant logo. */}
      <header className="pointer-events-none absolute left-4 top-3 select-none font-mono text-white">
        <h1 className="text-[10px] font-semibold tracking-[0.3em] uppercase text-[#00d4ff]/80">
          Apsis<span className="text-[#00d4ff]/40"> · </span>Space
        </h1>
        <p className="text-[9px] uppercase tracking-widest text-white/40">
          {statusText}
        </p>
      </header>

      {/* Top-center search */}
      <div className="pointer-events-none absolute left-1/2 top-4 -translate-x-1/2">
        {catalog && <SearchBar catalog={catalog} />}
      </div>

      {/* Right-side panel */}
      {selected && (
        <div className="pointer-events-none absolute right-4 top-4">
          <SidePanel satellite={selected} />
        </div>
      )}

      {/* Bottom-left legend */}
      <div className="pointer-events-none absolute bottom-4 left-4">
        <Legend catalog={catalog} />
      </div>

      {/* Bottom-center toolbar */}
      <div className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2">
        <Toolbar />
      </div>

      {/* First-run tip above the toolbar — fades once the user interacts. */}
      <WelcomeTip />

      {/* Bottom-right AI chat — independent from the Cesium tree */}
      <ChatPanel catalog={catalog} />

      {/* About / help modal */}
      <HelpModal />

      {/* Overlays */}
      {!catalog && failureCount > 0 && (
        <div className="pointer-events-auto absolute inset-0 z-50 flex flex-col items-center justify-center bg-black font-mono text-xs text-white">
          <p className="mb-4 text-white/80">Couldn't load the satellite catalog. Check your connection and try again.</p>
          <button
            type="button"
            onClick={() => refetch()}
            className="cursor-pointer border border-[#00d4ff]/40 bg-[#0a0a0a]/95 px-4 py-2 font-mono text-xs uppercase tracking-widest text-[#00d4ff] hover:border-[#00d4ff] hover:bg-[#00d4ff]/10"
          >
            Retry
          </button>
        </div>
      )}

      {showLoading && (!isPending || failureCount === 0) && (
        <div
          className={`absolute inset-0 z-50 flex flex-col items-center justify-center bg-black transition-opacity duration-300 ${
            fadingOut
              ? 'pointer-events-none opacity-0'
              : 'pointer-events-auto opacity-100'
          }`}
        >
          <div className="flex flex-col items-center font-mono">
            <h1 className="mb-4 text-lg font-semibold tracking-[0.3em] uppercase text-white/80">
              Apsis<span className="text-white/40"> · </span>Space
            </h1>
            <div className="flex items-center gap-1 text-[11px] uppercase tracking-widest text-[#00d4ff]">
              LOADING CATALOG
              <span className="inline-flex gap-0.5 ml-1">
                <Dot delay="0s" />
                <Dot delay="0.15s" />
                <Dot delay="0.3s" />
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Dot({ delay }: { delay: string }) {
  return (
    <span
      className="h-1 w-1 animate-pulse rounded-full bg-[#00d4ff]/70"
      style={{ animationDelay: delay }}
    />
  )
}

export default App

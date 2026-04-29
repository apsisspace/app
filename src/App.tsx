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

  // For the mobile legend overlay dismiss
  const legendOpen = useUIStore((s) => s.legendOpen)
  const toggleLegend = useUIStore((s) => s.toggleLegend)

  const [showLoading, setShowLoading] = useState(true)
  const [fadingOut, setFadingOut] = useState(false)

  // First-run welcome tip fades out on the user's first meaningful action.
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
  // When the user clicks a satellite we push /satellite/:noradId into history.
  // When they close the panel (selection → null), we push "/" back.
  //
  // Cold load of /satellite/:id: App's effects run before SatelliteRoute's
  // effects. We track whether we've ever observed a non-null selection;
  // before that happens a null selection on a /satellite/ URL is "route
  // still initializing" and we leave the URL alone.
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

  // Kick off the fade-out the moment the catalog arrives.
  useEffect(() => {
    if (!catalog) return
    setFadingOut(true)
    const timer = setTimeout(() => {
      setShowLoading(false)
    }, 300)
    return () => clearTimeout(timer)
  }, [catalog])

  let statusText: string | null = null
  if (catalog) {
    statusText = `${catalog.length.toLocaleString()} satellites`
  }

  return (
    <div className="relative h-full w-full">
      <Globe>
        {catalog && <SatelliteLayer satellites={catalog} />}
      </Globe>

      {/* ── MOBILE TOP BAR (< 768px) ─────────────────────────────────────
          Thin header row + full-width search, stacked in a column.
          Hidden on desktop (md:hidden). Safe-area-inset-top handles iOS notch. */}
      <div
        className="md:hidden pointer-events-none absolute left-0 right-0 top-0 z-10 flex flex-col"
        style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
      >
        {/* Thin brand row */}
        <div className="flex items-center px-3 py-1.5 select-none font-mono">
          <span className="text-[9px] font-semibold tracking-[0.3em] uppercase text-[#00d4ff]/80">
            A·S
          </span>
          {statusText && (
            <span className="ml-2 text-[8px] uppercase tracking-widest text-white/30">
              {statusText}
            </span>
          )}
        </div>
        {/* Full-width search */}
        <div className="pointer-events-none px-3 pb-2">
          {catalog && <SearchBar catalog={catalog} />}
        </div>
      </div>

      {/* ── DESKTOP HEADER (≥ 768px) ─────────────────────────────────────
          Top-left brand mark — deliberately small, not a dominant logo. */}
      <header className="pointer-events-none absolute left-4 top-3 hidden select-none font-mono text-white md:block">
        <h1 className="text-[10px] font-semibold tracking-[0.3em] uppercase text-[#00d4ff]/80">
          Apsis<span className="text-[#00d4ff]/40"> · </span>Space
        </h1>
        <p className="text-[9px] uppercase tracking-widest text-white/40">
          {statusText}
        </p>
      </header>

      {/* ── DESKTOP SEARCH (≥ 768px) ─────────────────────────────────────
          Centered horizontally at the top. */}
      <div className="pointer-events-none absolute left-1/2 top-4 hidden -translate-x-1/2 md:block">
        {catalog && <SearchBar catalog={catalog} />}
      </div>

      {/* ── SIDE PANEL ───────────────────────────────────────────────────
          Desktop: absolute right-4 top-4 (320px wide).
          Mobile:  fixed bottom drawer, slides up, dims the globe behind it. */}
      {selected && (
        <>
          {/* Dim overlay — mobile only, visual only. pointer-events: none so
              taps pass through to the Cesium canvas, where SatelliteLayer's
              LEFT_CLICK handler already calls clear() on empty-space taps.
              A pointer-events-auto overlay here would catch the browser's
              synthetic click that fires after the touchend that selected the
              satellite (React commits the overlay in a microtask, the click
              arrives as a macrotask, hitting the overlay before the user
              can react) — causing the panel to flash open and instantly close. */}
          <div
            className="pointer-events-none md:hidden fixed inset-0 z-20 bg-black/40"
            aria-hidden
          />
          {/* Panel wrapper */}
          <div
            className="pointer-events-none fixed bottom-0 left-0 right-0 z-30 max-h-[70vh] overflow-y-auto md:absolute md:bottom-auto md:left-auto md:right-4 md:top-4 md:z-auto md:max-h-none md:overflow-visible"
          >
            <div className="animate-slide-up md:animate-none">
              <SidePanel satellite={selected} />
            </div>
          </div>
        </>
      )}

      {/* ── LEGEND ───────────────────────────────────────────────────────
          Desktop: bottom-left panel (existing behaviour).
          Mobile:  fixed popup at top-right, below the search bar.
                   Tap the legend icon in the toolbar to toggle.
                   A transparent overlay behind it catches "tap outside". */}

      {/* Mobile legend overlay — catches taps outside to dismiss */}
      {legendOpen && (
        <div
          className="pointer-events-auto md:hidden fixed inset-0 z-[25]"
          onClick={toggleLegend}
          aria-hidden
        />
      )}

      {/* Mobile legend popup — top-right, above the overlay */}
      <div
        className="pointer-events-none md:hidden fixed right-4 z-[26]"
        style={{ top: 'calc(env(safe-area-inset-top, 0px) + 80px)' }}
      >
        <Legend catalog={catalog} />
      </div>

      {/* Desktop legend — bottom-left */}
      <div className="pointer-events-none absolute bottom-4 left-4 hidden md:block">
        <Legend catalog={catalog} />
      </div>

      {/* ── BOTTOM TOOLBAR ───────────────────────────────────────────────
          Centered; respects iOS home-indicator safe area. */}
      <div
        className="pointer-events-none absolute left-1/2 -translate-x-1/2"
        style={{ bottom: 'calc(1rem + env(safe-area-inset-bottom, 0px))' }}
      >
        <Toolbar />
      </div>

      {/* First-run tip above the toolbar. bottom-20 on mobile avoids
          overlapping the toolbar's larger touch targets. */}
      <WelcomeTip />

      {/* ── AI CHAT ──────────────────────────────────────────────────────
          ChatPanel handles its own position (see ChatPanel.tsx). */}
      <ChatPanel catalog={catalog} />

      {/* About / help modal */}
      <HelpModal />

      {/* ── OVERLAYS ─────────────────────────────────────────────────────*/}
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

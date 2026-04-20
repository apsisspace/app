import { useEffect } from 'react'
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
  const { data: catalog, isPending, failureCount } = useSatelliteCatalog()
  const selectedNoradId = useSelectedNoradId()
  const selected = catalog ? findSelected(catalog, selectedNoradId) : null

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

  // We retry indefinitely, so the query never settles into a terminal error
  // state. failureCount lets us distinguish first load vs. stuck retrying.
  let statusText: string | null = null
  if (catalog) {
    statusText = `${catalog.length.toLocaleString()} satellites`
  } else if (isPending && failureCount === 0) {
    statusText = 'Loading active catalog…'
  } else if (isPending) {
    statusText = "Couldn't load the satellite catalog. Retrying in a moment…"
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
    </div>
  )
}

export default App

import { ChatPanel } from './components/ChatPanel'
import { Globe } from './components/Globe'
import { SatelliteLayer } from './components/SatelliteLayer'
import { SearchBar } from './components/SearchBar'
import { SidePanel } from './components/SidePanel'
import { useSatelliteCatalog } from './hooks/useSatelliteCatalog'
import {
  useSelectedNoradId,
  findSelected,
} from './hooks/useSelectedSatellite'

// TODO(auth): Add user accounts and pro tier gating.

function App() {
  const { data: catalog, isPending, failureCount } = useSatelliteCatalog()
  const selectedNoradId = useSelectedNoradId()
  const selected = catalog ? findSelected(catalog, selectedNoradId) : null

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

      {/* Top-left brand + status */}
      <header className="pointer-events-none absolute left-4 top-4 select-none font-mono text-white">
        <h1 className="text-sm font-semibold tracking-[0.2em] uppercase text-[#00d4ff]">
          Apsis Space
        </h1>
        <p className="text-[10px] uppercase tracking-widest text-white/50">
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

      {/* Bottom-right AI chat — independent from the Cesium tree */}
      <ChatPanel catalog={catalog} />
    </div>
  )
}

export default App

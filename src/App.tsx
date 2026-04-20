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
// TODO(ai): Add AI query layer (Claude Haiku via Vercel Edge Function proxy,
//   20 queries/day per IP, $5/day global budget cap).

function App() {
  const { data: catalog, isLoading, isError, error } = useSatelliteCatalog()
  const selectedNoradId = useSelectedNoradId()
  const selected = catalog ? findSelected(catalog, selectedNoradId) : null

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
          {isLoading && 'Loading active catalog…'}
          {isError && `Catalog error: ${(error as Error).message}`}
          {catalog && `${catalog.length.toLocaleString()} satellites`}
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
    </div>
  )
}

export default App

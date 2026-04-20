import { Globe } from './components/Globe'
import { SatelliteLayer } from './components/SatelliteLayer'
import { useISS } from './hooks/useSatellites'

// TODO(auth): Add user accounts and pro tier gating.
// TODO(ai): Add AI query layer (Claude Haiku via Vercel Edge Function proxy,
//   20 queries/day per IP, $5/day global budget cap).

function App() {
  const { data: satellites, isLoading, isError, error } = useISS()

  return (
    <div className="relative h-full w-full">
      <Globe>
        {satellites && <SatelliteLayer satellites={satellites} />}
      </Globe>

      <header className="pointer-events-none absolute left-4 top-4 select-none text-white">
        <h1 className="text-lg font-semibold tracking-wide">Apsis Space</h1>
        <p className="text-xs opacity-80">
          {isLoading && 'Fetching ISS TLE…'}
          {isError && `TLE load error: ${(error as Error).message}`}
          {satellites && `Tracking ${satellites.length} satellite(s)`}
        </p>
      </header>
    </div>
  )
}

export default App

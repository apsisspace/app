/* eslint-disable react-refresh/only-export-components --
 * This is the app entry module: it calls createRoot and defines lazy() route
 * components alongside the bootstrap. React Fast Refresh's component-only-export
 * rule doesn't apply to the root entry, so it's disabled here rather than
 * fragmenting the router across extra files. */
import { StrictMode, Suspense, lazy } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Switch, Route, useRoute } from 'wouter'
import { HelmetProvider } from 'react-helmet-async'
import './index.css'
import App from './App.tsx'
import { ErrorBoundary } from './components/ErrorBoundary.tsx'
import { SatelliteRoute } from './routes/SatelliteRoute'
import { NotFoundRoute } from './routes/NotFoundRoute'

// Content routes are code-split: the long-form article prose, stats logic,
// and about page live in their own chunks so the live tracker (the default
// route) doesn't pay for them on first paint.
const About = lazy(() => import('./pages/About').then((m) => ({ default: m.About })))
const Learn = lazy(() => import('./pages/Learn').then((m) => ({ default: m.Learn })))
const Stats = lazy(() => import('./pages/Stats').then((m) => ({ default: m.Stats })))
const ArticleRoute = lazy(() =>
  import('./routes/ArticleRoute').then((m) => ({ default: m.ArticleRoute })),
)
const SatellitesIndexRoute = lazy(() =>
  import('./routes/SatellitesIndexRoute').then((m) => ({
    default: m.SatellitesIndexRoute,
  })),
)

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // TLEs are updated by Celestrak a few times per day; 6h stale window
      // is conservative and avoids hammering their servers during dev.
      staleTime: 6 * 60 * 60 * 1000,
      retry: 2,
    },
  },
})

// Keep App (and the Globe inside it) mounted for both / and /satellite/:id.
// Previously the Switch unmounted App (and thus Globe/Cesium) on every
// selection-driven route change, causing the Cesium viewer to be recreated
// and Earth mode to reset visually. With this structure Globe is a stable
// singleton and SatelliteRoute is a pure overlay (Helmet + 404 + selection
// sync) that sits on top without owning its own viewer.
function GlobeTracker() {
  const [isSatellite] = useRoute('/satellite/:norad_id')
  const [isHome] = useRoute('/')
  if (!isSatellite && !isHome) return <NotFoundRoute />
  return (
    <>
      <App />
      <Route path="/satellite/:norad_id" component={SatelliteRoute} />
    </>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <HelmetProvider>
        <QueryClientProvider client={queryClient}>
          <Suspense fallback={<div className="min-h-screen bg-black" />}>
            <Switch>
              <Route path="/about" component={About} />
              <Route path="/learn" component={Learn} />
              <Route path="/learn/:slug" component={ArticleRoute} />
              <Route path="/stats" component={Stats} />
              <Route path="/satellites" component={SatellitesIndexRoute} />
              <Route component={GlobeTracker} />
            </Switch>
          </Suspense>
        </QueryClientProvider>
      </HelmetProvider>
    </ErrorBoundary>
  </StrictMode>,
)

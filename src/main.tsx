import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Switch, Route } from 'wouter'
import { HelmetProvider } from 'react-helmet-async'
import './index.css'
import App from './App.tsx'
import { ErrorBoundary } from './components/ErrorBoundary.tsx'
import { About } from './pages/About'
import { SatelliteRoute } from './routes/SatelliteRoute'
import { SatellitesIndexRoute } from './routes/SatellitesIndexRoute'
import { NotFoundRoute } from './routes/NotFoundRoute'

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

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <HelmetProvider>
        <QueryClientProvider client={queryClient}>
          <Switch>
            <Route path="/about" component={About} />
            <Route path="/satellites" component={SatellitesIndexRoute} />
            <Route path="/satellite/:norad_id" component={SatelliteRoute} />
            <Route path="/" component={App} />
            <Route component={NotFoundRoute} />
          </Switch>
        </QueryClientProvider>
      </HelmetProvider>
    </ErrorBoundary>
  </StrictMode>,
)

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Switch, Route } from 'wouter'
import './index.css'
import App from './App.tsx'
import { ErrorBoundary } from './components/ErrorBoundary.tsx'
import { About } from './pages/About'

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
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <Switch>
        <Route path="/about" component={About} />
        <Route path="/" component={App} />
      </Switch>
    </QueryClientProvider>
  </StrictMode>,
)

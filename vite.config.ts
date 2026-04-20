import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import cesium from 'vite-plugin-cesium'
import catalogHandler from './api/catalog'

// vite-plugin-cesium copies Cesium's static assets (workers, widgets,
// imagery, fonts) into the bundle so Cesium can locate them at runtime.

/**
 * Dev-only plugin: serves our Vercel Edge Function(s) under /api/* so that
 * `npm run dev` works without `vercel dev`. Each handler is invoked with a
 * Fetch-style Request and returns a Fetch Response; we adapt Node's
 * (req, res) to that shape.
 */
function edgeApiDevPlugin(): Plugin {
  return {
    name: 'apsis-edge-api-dev',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/api/catalog', async (req, res) => {
        try {
          const host = req.headers.host ?? 'localhost'
          const url = new URL(req.url ?? '/', `http://${host}`)
          const request = new Request(url.toString(), {
            method: req.method,
            // Node's IncomingHttpHeaders map cleanly enough for our use.
            headers: req.headers as Record<string, string>,
          })
          const response = await catalogHandler(request)
          res.statusCode = response.status
          response.headers.forEach((value, key) => {
            res.setHeader(key, value)
          })
          const body = await response.text()
          res.end(body)
        } catch (err) {
          res.statusCode = 500
          res.end(err instanceof Error ? err.message : String(err))
        }
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), cesium(), edgeApiDevPlugin()],
})

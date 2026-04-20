import { defineConfig, type Plugin } from 'vite'
import type { IncomingMessage, ServerResponse } from 'node:http'
import react from '@vitejs/plugin-react'
import cesium from 'vite-plugin-cesium'
import catalogHandler from './api/catalog'
import queryHandler from './api/query'

// vite-plugin-cesium copies Cesium's static assets (workers, widgets,
// imagery, fonts) into the bundle so Cesium can locate them at runtime.

type FetchHandler = (req: Request) => Promise<Response>

/** Read the full request body as UTF-8 text (safe for our JSON endpoints). */
function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    req.on('data', (chunk: Buffer) => chunks.push(chunk))
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
    req.on('error', reject)
  })
}

/** Adapt a Fetch-style Edge handler to a Node (req, res) middleware. */
async function runEdgeHandler(
  handler: FetchHandler,
  req: IncomingMessage,
  res: ServerResponse,
): Promise<void> {
  try {
    const host = req.headers.host ?? 'localhost'
    const url = new URL(req.url ?? '/', `http://${host}`)
    const method = req.method ?? 'GET'
    const hasBody = method !== 'GET' && method !== 'HEAD'
    const body = hasBody ? await readBody(req) : undefined
    const request = new Request(url.toString(), {
      method,
      headers: req.headers as Record<string, string>,
      body,
    })
    const response = await handler(request)
    res.statusCode = response.status
    response.headers.forEach((value, key) => {
      res.setHeader(key, value)
    })
    const text = await response.text()
    res.end(text)
  } catch (err) {
    res.statusCode = 500
    res.end(err instanceof Error ? err.message : String(err))
  }
}

/**
 * Dev-only plugin: serves our Vercel Edge Function(s) under /api/* so that
 * `npm run dev` works without `vercel dev`.
 */
function edgeApiDevPlugin(): Plugin {
  return {
    name: 'apsis-edge-api-dev',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/api/catalog', (req, res) => {
        void runEdgeHandler(catalogHandler, req, res)
      })
      server.middlewares.use('/api/query', (req, res) => {
        void runEdgeHandler(queryHandler, req, res)
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), cesium(), edgeApiDevPlugin()],
})

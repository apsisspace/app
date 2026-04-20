import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import cesium from 'vite-plugin-cesium'

// vite-plugin-cesium copies Cesium's static assets (workers, widgets,
// imagery, fonts) into the bundle so Cesium can locate them at runtime.
export default defineConfig({
  plugins: [react(), cesium()],
})

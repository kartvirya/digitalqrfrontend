import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
    hmr: {
      overlay: true
    }
  },
  build: {
    outDir: 'build',
    sourcemap: true
  },
  optimizeDeps: {
    exclude: []
  }
})

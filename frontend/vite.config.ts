import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
/** npm workspaces hoist deps here; Vite otherwise looks under frontend/node_modules only. */
const monorepoRoot = path.resolve(__dirname, '..')

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    dedupe: ['react', 'react-dom'],
    alias: {
      react: path.resolve(monorepoRoot, 'node_modules/react'),
      'react-dom': path.resolve(monorepoRoot, 'node_modules/react-dom'),
      'react-dom/client': path.resolve(monorepoRoot, 'node_modules/react-dom/client.js'),
      sonner: path.resolve(monorepoRoot, 'node_modules/sonner'),
    },
  },
  server: {
    port: 5173,
    fs: {
      allow: [monorepoRoot],
    },
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5021',
        changeOrigin: true,
      },
    },
  },
})

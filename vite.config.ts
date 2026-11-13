import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    proxy: {
      '/display': 'http://localhost:8765',
      '/ranking': 'http://localhost:8765',
      '/actions': 'http://localhost:8765',
    },
  },
  preview: {
    host: true,
    port: 4173,
    proxy: {
      '/display': 'http://localhost:8765',
      '/ranking': 'http://localhost:8765',
      '/actions': 'http://localhost:8765',
    },
  },
})

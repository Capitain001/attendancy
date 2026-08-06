import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [tailwindcss(), react()],
  // Vite écoute sur 1420 — référencé dans tauri.conf.json devUrl
  server: {
    port: 1420,
    strictPort: true,
  },
  build: {
    outDir: 'dist',
  },
})

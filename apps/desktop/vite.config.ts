import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [tailwindcss(), react()],
  resolve: {
    alias: [
      {
        find: /^@\/services\/([^/]+)\/actions$/,
        replacement: path.resolve(__dirname, '../../packages/rpc/src/generated/$1.ts'),
      },
      { find: '@rpc-api', replacement: path.resolve(__dirname, 'src/lib/api.ts') },
      { find: '@ui', replacement: path.resolve(__dirname, '../../packages/ui/src') },
      { find: '@desktop', replacement: path.resolve(__dirname, 'src') },
      { find: '@', replacement: path.resolve(__dirname, '../web/src') },
    ],
  },
  // Vite écoute sur 1420 — référencé dans tauri.conf.json devUrl
  server: {
    port: 1420,
    strictPort: true,
  },
  build: {
    outDir: 'dist',
  },
})

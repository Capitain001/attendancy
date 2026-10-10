import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// Empêche Vite de vider la console Rust en cas de logs/erreurs
const host = process.env.TAURI_DEV_HOST

export default defineConfig({
  plugins: [tailwindcss(), react()],

  // Tauri utilise des variables d'environnement préfixées par TAURI_
  envPrefix: ['VITE_', 'TAURI_'],

  clearScreen: false,

  resolve: {
    alias: [
      // 1. Alias 'next/link' intercepte les imports Web et redirige vers le Link TanStack
      {
        find: 'next/link',
        replacement: path.resolve(__dirname, './src/components/ui/Link.tsx'),
      },
      // 2. Tes alias RPC et Monorepo existants
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

  // Configuration du serveur de Dev pour Tauri
  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    hmr: host
      ? {
          protocol: 'ws',
          host,
          port: 1421,
        }
      : undefined,
    watch: {
      // Ignore les changements dans le dossier src-tauri pour éviter les boucles de build
      ignored: ['**/src-tauri/**'],
    },
  },

  build: {
    outDir: 'dist',
    // Cible Chrome/Safari modernes pris en charge par WebView2 (Windows) / WebKit (macOS/Linux)
    target: process.env.TAURI_ENV_PLATFORM === 'windows' ? 'chrome105' : 'safari15',
    minify: !process.env.TAURI_ENV_DEBUG ? 'esbuild' : false,
    sourcemap: !!process.env.TAURI_ENV_DEBUG,
  },
})
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";

import path from "node:path";

const host = process.env.TAURI_DEV_HOST;

export default defineConfig({
  plugins: [TanStackRouterVite({ target: "react" }), react(), tailwindcss()],
  clearScreen: false,
  publicDir: path.resolve(__dirname, "../web/public"),
  resolve: {
    alias: [
      {
        // Stub client-side pour `import "server-only"` qui peut arriver par
        // transitivité depuis des modules web partagés (hooks, queries, utils).
        find: "server-only",
        replacement: path.resolve(__dirname, "./src/lib/server-only-stub.ts"),
      },
      {
        find: "next/link",
        replacement: path.resolve(__dirname, "./src/components/ui/Link.tsx"),
      },
      {
        find: "next/navigation",
        replacement: path.resolve(__dirname, "./src/lib/next-navigation.ts"),
      },
      {
        find: /^@\/services\/(schedule\/policy|schedule\/queries|session\/policy)$/,
        replacement: path.resolve(__dirname, "../web/src/services/$1"),
      },
      {
        // Intercepte @/services/<svc>/actions  ET  @/services/<svc>
        // et les redirige vers le stub RPC généré correspondant.
        find: /^@\/services\/([^/]+)(\/actions)?$/,
        replacement: path.resolve(__dirname, "../../packages/rpc/src/generated/$1.ts"),
      },
      { find: "@rpc-api", replacement: path.resolve(__dirname, "src/lib/api.ts") },
      { find: "@ui", replacement: path.resolve(__dirname, "../../packages/ui/src") },
      { find: "@", replacement: path.resolve(__dirname, "../web/src") },
    ],
  },
  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    hmr: host ? { protocol: "ws", host, port: 1421 } : undefined,
    watch: { ignored: ["**/src-tauri/**"] },
  },
});

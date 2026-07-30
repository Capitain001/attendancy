// vitest.config.ts
// Deux projets de test séparés par convention de nommage :
//   *.unit.test.ts        — purs, sans I/O, rapides (5s timeout)
//   *.integration.test.ts — accès DB réel via TEST_DATABASE_URL (15s timeout)
import { defineConfig } from "vitest/config";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

// Override DB pour les tests d'intégration (Prisma lit DATABASE_URL au chargement)
if (!process.env.TEST_DATABASE_URL) {
  const envPath = resolve(process.cwd(), ".env");
  if (existsSync(envPath)) {
    const envContent = readFileSync(envPath, "utf-8");
    for (const line of envContent.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const [key, ...rest] = trimmed.split("=");
      if (key && rest.length && process.env[key] === undefined) {
        process.env[key] = rest.join("=").replace(/^["']|["']$/g, "");
      }
    }
  }
}
// Les transactions interactives Prisma ($transaction avec callback) nécessitent
// une connexion directe — le pooler Neon (PgBouncer transaction mode) ne les
// supporte pas (P2028). On dérive l'URL directe en retirant "-pooler" du host.
const testDirectUrl =
  process.env.TEST_DIRECT_URL ??
  (process.env.TEST_DATABASE_URL ?? "").replace(/-pooler\./, ".");
process.env.DATABASE_URL = testDirectUrl;

export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  test: {
    pool: "forks",

    projects: [
      {
        extends: true,
        test: {
          name: "unit",
          environment: "node",
          include: ["src/**/*.unit.test.ts"],
          testTimeout: 5_000,
        },
      },
      {
        extends: true,
        test: {
          name: "integration",
          environment: "node",
          include: ["src/**/*.integration.test.ts"],
          testTimeout: 30_000,
          hookTimeout: 60_000,
        },
      },
    ],
  },
});

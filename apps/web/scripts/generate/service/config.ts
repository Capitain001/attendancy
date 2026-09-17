// scripts/generate/service/config.ts
//
// Tout ce qu'un opérateur (dev) peut vouloir ajuster si la convention du
// projet change — chemins racine, alias d'import injectés dans le code
// généré, valeurs par défaut — SANS toucher à la logique de génération
// (service.ts) ni au contenu des gabarits (templates.ts).
//
// Règle : un alias qui apparaît dans plusieurs gabarits doit vivre ICI et
// nulle part ailleurs. C'est ce qui évite la divergence silencieuse (ex :
// service.ts et create-service.ts avaient fini par pointer vers deux chemins
// Prisma différents — @/lib/prisma vs @/lib/db — faute d'une source unique).

import { join } from "node:path";

// ─── Racines du projet ──────────────────────────────────────────────────────

export const SERVICES_ROOT = join(process.cwd(), "src", "services");

export const DEFAULT_KEY_REGISTRY_PATH = join(
  process.cwd(),
  "src",
  "cache",
  "server",
  "key.ts",
);
export const DEFAULT_GRAPH_REGISTRY_PATH = join(
  process.cwd(),
  "src",
  "cache",
  "server",
  "graph.ts",
);

// ─── Alias d'import injectés dans le code généré ───────────────────────────
// Source unique. Convention projet :
//   - @/generated/prisma/client → runtime Prisma (server only)
//   - @/generated/prisma/browser → types & enums (safe côté client)

export const IMPORT_PATHS = {
  prisma: "@/lib/prisma",
  // Runtime serveur (client Prisma) vs types/enums (browser-safe) — deux
  // entrées distinctes, ne jamais les confondre dans un gabarit.
  prismaClient: "@/generated/prisma/client",
  prismaTypes: "@/generated/prisma/browser",
  cacheKey: "@/cache/server/key",
  cacheGraph: "@/cache/server/graph",
  nextCache: "next/cache",
  servicesRoot: "@/services",
  authService: "@/services/auth",
  auditService: "@/services/audit",
  errorsConfig: "@/config",
  prismaTryConstraint: "@/utils/server/prisma",
} as const;

// ─── Valeurs par défaut du code généré ─────────────────────────────────────

/** Rôle requis par défaut sur les mutations générées (actions/*.mutations.ts). */
export const DEFAULT_MUTATION_ROLE = "DIRECTION";

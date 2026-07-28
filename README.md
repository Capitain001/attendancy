# captain-template

Template de démarrage Next.js — architecture, configuration, patterns et
conventions, sans logique métier.

## Stack

Next.js 16 (`cacheComponents`/PPR) · React 19 · Prisma v7 multi-schema
(adapter pg) · Supabase Auth · Tailwind v4 + shadcn/ui + base-ui ·
TypeScript strict · Valibot · Vitest.

## Setup d'un nouveau projet

```bash
# 1. Cloner et renommer
git clone <ce-repo> mon-projet && cd mon-projet

# 2. Dépendances
npm install   # ou bun install

# 3. Environnement
cp .env.example .env   # remplir Supabase + Postgres

# 4. Schémas Prisma — REQUIS avant de compiler
#    Le socle attend au minimum les modèles : User, Organization, AuditLog.
#    Voir prisma/schemas/README.md pour les conventions.
#    Puis :
npx prisma generate
npx prisma migrate dev

# 5. Points d'extension
#    Chercher "⚠ À ÉTENDRE PAR PROJET" dans le code — chaque marqueur documente
#    ce que le projet doit fournir (rôles, types, cache, routes…).
```

## Où lire quoi

| Sujet | Fichier |
|---|---|
| Conventions globales | `AGENTS.md` |
| Pattern des services | `docs/skills/service-module-pattern/SKILL.md` |
| Réflexion domaine / composition | `src/services/SERVICE_CONTEXT.md` |
| Exemple canonique de service | `src/services/entity/` (commenté) |
| Structure de `docs/` | `docs/DOCS_CONTEXT.md` |
| Découpage Prisma multi-schema | `prisma/schemas/README.md` |

## Architecture (résumé)

```
src/
  app/            # App Router — (auth) public, (app)/[slug] multi-tenant
  cache/          # server: tags Next 16 ("use cache") · client: clés React Query
  config/         # ERRORS, URLs, redirects — constantes transverses
  hooks/          # utilitaires + entity/ (factory CRUD client) + data/ (par domaine)
  lib/            # db (Prisma singleton), utils (cn), errors, toast, export
  providers/      # React Query provider (actif dans app/layout.tsx)
  services/       # 1 modèle = 1 service : actions/ + database/ + cache + CLAUDE.md
  store/          # stores Zustand (état client partagé — voir STORE_CONTEXT.md)
  styles/         # tokens layout/typo/composants + thèmes CSS
  utils/          # supabase (server/client/middleware), server (prisma, audit)
prisma/
  schemas/        # multi-schema — un .prisma par domaine
  post-migrate/   # SQL hors Prisma (index avancés, triggers) — voir README
  seed/           # orchestrateur + un fichier par domaine
scripts/
  generate/       # générateurs : api (indexeur), types (DTOs), icons/svg
  test-db-setup.js# bootstrap base de test (reset + post-migrate SQL)
```

## Couche client

Composant client → hook `hooks/data/<domain>/` → `useCrudEntity` (React Query,
optimiste, toasts) → helpers `actionHelpers` → server actions. Jamais d'action
appelée directement dans un composant. Mode d'emploi : `src/hooks/entity/USAGE.md`.

## Tests

- `*.unit.test.ts` co-localisés (purs, sans I/O) · `*.integration.test.ts` (DB réelle)
- Base de test : `npm run test:db:setup` (exige `TEST_DATABASE_URL ≠ DATABASE_URL`)
- Helpers par service : `src/services/<svc>/__tests__/` (exemple : `entity/__tests__/`)

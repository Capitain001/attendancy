# Conventions du projet

## Avant d'écrire du code

- `src/services/**` → lire `docs/skills/service-module-pattern/SKILL.md` puis le
  `CLAUDE.md` du service concerné. Réflexion domaine : `src/services/SERVICE_CONTEXT.md`.
- `src/hooks/data/**` → lire `src/hooks/data/DATA_CONTEXT.md` + `src/hooks/entity/USAGE.md`.
- `src/store/**` → lire `src/store/STORE_CONTEXT.md` (quand un store vs React Query vs RSC).
- `docs/**` → lire `docs/DOCS_CONTEXT.md` (quel document va dans quel dossier).
- `prisma/schemas/**` → lire `prisma/schemas/README.md` (découpage multi-schema).
- `prisma/post-migrate/**` → lire `prisma/post-migrate/README.md` (SQL hors Prisma).

## Stack (non négociable)

Next.js 16 (`cacheComponents: true` — PPR actif) · React 19 · Prisma v7
multi-schema (adapter pg) · Supabase (auth) · Tailwind v4 + shadcn/ui + base-ui ·
TypeScript strict · Valibot · Vitest.

## Invariants (toujours enforced)

- `orgId` extrait du token auth serveur UNIQUEMENT — jamais du body/query/headers.
- Prisma uniquement dans `services/*/database/` — jamais dans actions ou composants.
- `"use server"` uniquement dans `actions/` — jamais sur les utilitaires.
- Frontend (pages RSC incluses) → toujours via `actions/`, jamais `database/`.
- Actions : préfixe `get*` (jamais `list*`), retour `{ data }` / `{ error: string }`.
- Pages RSC sans `getUserInfo()` direct → `await connection()` (next/server) en
  tête (contrainte PPR de cacheComponents).
- Valibot pour toute validation — jamais Zod.
- Chaque service maintient son `CLAUDE.md` à jour.
- Composants clients : jamais d'appel direct à une server action — toujours via
  un hook `src/hooks/data/<domain>/` (useCrudEntity/useEntity).
- Toast : importer `@/lib/toast/custom-toast` — jamais sonner directement.
- Un store Zustand ne duplique jamais une donnée gérée par React Query.

## Contexte projet

<!-- ⚠ À ÉTENDRE PAR PROJET — référencer ici les fichiers docs/context/ du
     domaine métier, à lire avant d'écrire de la logique métier. Exemple :
- `docs/context/01_overview.yaml` — vision produit
- `docs/context/06_business_rules.yaml` — règles métier RULE-*
-->

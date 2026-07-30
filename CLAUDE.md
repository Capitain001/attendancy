# Conventions du projet

## Avant d'écrire du code

- `src/services/**` → lire `docs/skills/service-module-pattern/SKILL.md` puis le
  `CLAUDE.md` du service concerné. Réflexion domaine : `src/services/SERVICE_CONTEXT.md`.
- `src/app/**` (pages RSC, layouts) → lire `docs/skills/nextjs-ppr/SKILL.md` (règle
  `connection()` / Suspense — contrainte PPR `cacheComponents: true`).
- `src/hooks/data/**` → lire `src/hooks/data/DATA_CONTEXT.md` + `src/hooks/entity/USAGE.md`.
- `src/store/**` → lire `src/store/STORE_CONTEXT.md` (quand un store vs React Query vs RSC).
- `docs/**` → lire `docs/DOCS_CONTEXT.md` (quel document va dans quel dossier).
- `prisma/schemas/**` → lire `prisma/schemas/README.md` (découpage multi-schema).
- `prisma/post-migrate/**` → lire `prisma/post-migrate/README.md` (SQL hors Prisma).
- Tout nouveau service créé → écrire son `CLAUDE.md` avant le premier commit.

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

## Naming (non négociable)

### Suppressions
- **Soft delete** (`deletedAt`) → préfixe `remove` · événement `*_REMOVED`
  - ✅ `removeRoom`, `GROUP_REMOVED`
  - ❌ `deleteRoom`, `GROUP_DELETED`
- **Hard delete** (row supprimé physiquement) → préfixe `delete` · événement `*_DELETED`
  - ✅ `deleteRoom`, `GROUP_DELETED`

### Lecture
- Toujours `get*` — le préfixe `list*` est interdit partout (DB, actions, hooks).
  - ✅ `getRooms`, `getSchedulesAction`
  - ❌ `listRooms`, `listSchedulesAction`

### Typage Prisma
- `Awaited<ReturnType<typeof fn>>` — jamais `Prisma.PromiseReturnType<>`.

### ActionResponse
- Retour discriminé : `{ data: T } | { error: string }` — jamais `{ data?: T; error?: string }`.
- Narrowing : `if ('error' in result)` — jamais `if (result.error)`.

### Vérification post-travail

Après chaque session sur `src/services/**` — lancer avant le commit :

```
npx tsx scripts/generate/naming/check.ts <service>
npx tsx scripts/generate/types/check.ts <service>
npx tsx scripts/generate/api/api.ts <service>
```

- `naming/check.ts` : corrige tous les `⚠` de convention (exit 0, non bloquant,
  mais violations réelles).
- `types/check.ts` : vérifie que les `Awaited<ReturnType<...>>` sont dans `types.ts`
  et non dans `database.ts`, `actions.ts` ou autre (exit 0, non bloquant).
- `api.ts` : met à jour l'index API du service — obligatoire après toute
  mutation d'action (ajout, renommage, suppression).

## Propriété des modèles

Un modèle Prisma appartient à **un seul service**. Prisma ne s'utilise que dans
le `database/` de ce service. Un service consommateur appelle les fonctions de
l'owner — il ne refait pas un `prisma.x.findMany()` sur un modèle étranger.

## Contexte projet

<!-- ⚠ À ÉTENDRE PAR PROJET — référencer ici les fichiers docs/context/ du
     domaine métier, à lire avant d'écrire de la logique métier. Exemple :
- `docs/context/01_overview.yaml` — vision produit
- `docs/context/06_business_rules.yaml` — règles métier RULE-*
-->

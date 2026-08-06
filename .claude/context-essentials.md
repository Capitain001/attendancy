# Context Essentials — attendancy

## Sécurité / Auth
- `orgId` : token auth serveur UNIQUEMENT — jamais body/query/headers
- `"use server"` : uniquement dans `services/*/actions/` — jamais sur utilitaires
- Auth : `authAccess()` par défaut → discriminer `if (!auth.data)` — JAMAIS `if (auth.error)`

## Service-module-pattern (`services/<module>/`)
Structure : `actions/` (queries.ts + mutations.ts) · `database/` · `cache.ts` · `validation.ts` · `types.ts` · `index.ts` · `CLAUDE.md`
- `database/` : interne — jamais importé hors `services/<module>/`
- Queries DB : `"use cache"` en tête + `cacheTag()` + `cacheLife()` + `select` explicite + `deletedAt: null`
- Mutations DB : `tryConstraint()` + `invalidateEvent()` + `orgId` dans `where`
- Validation : Valibot UNIQUEMENT — `v.safeParse` (jamais `v.parse`) — param action = `Input`, après parse = `Output`
- `CLAUDE.md` obligatoire avant premier commit, mis à jour à chaque évolution

## Prisma
- Uniquement dans `services/*/database/` — jamais ailleurs
- Types : `Awaited<ReturnType<typeof fn>>` — JAMAIS `Prisma.PromiseReturnType<>`
- 1 modèle = 1 service owner — consommateurs appellent les fns owner

## Actions / Frontend
- Frontend → uniquement via `actions/` — jamais accès direct `database/`
- Composants clients → uniquement via hook `hooks/data/<domain>/` — jamais server action directe
- Retour : `{ data: T } | { error: string }` — jamais `{ data?: T; error?: string }`
- Narrowing : `if ('error' in result)` — jamais `if (result.error)`

## Naming
- Lecture : préfixe `get*` — `list*` INTERDIT partout
- Soft delete (`deletedAt`) → `remove*` · événement `*_REMOVED`
- Hard delete (row physique) → `delete*` · événement `*_DELETED`

## RSC / PPR
- Page RSC sans `getUserInfo()` → `await connection()` EN TÊTE (contrainte PPR `cacheComponents:true`)

## Packages
- `packages/planning` + `packages/types` : JAMAIS Prisma, JAMAIS server actions — HTTP uniquement

## Index — lecture rapide avant d'ouvrir les sources (depuis apps/web/)
- `summary/<service>.json` → toutes les fns consolidées — LIRE EN PREMIER
- `.api/<service>/<fnName>.json` → contrat détaillé (signature, kind, deps cross-service)
- `.api/` = source de vérité · `summary/` = vue dérivée (jamais éditée à la main)

## Commandes post-travail (depuis apps/web/)
```bash
bun run check:naming:svc -- <service>     # conventions naming (non bloquant)
bun run check:types:svc -- <service>      # Awaited<ReturnType<>> dans types.ts
bun run generate:api:svc -- <service>     # obligatoire après toute mutation d'action
bun run generate:types:svc -- <service>   # après modif database/*.queries.ts
bun run api:check                         # validation cross-service — obligatoire avant commit
bun run generate:summary:svc -- <service> # optionnel — vue IA à jour
```

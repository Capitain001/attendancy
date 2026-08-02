# Inventaire des bons patterns V2 → V1 — attendancy

## Contexte

- **V2** (référence, actuel) : `C:\PROJECTS\PROJECT\PRODUCTIONS\attendancy`
- **V1** (cible du refactor) : `C:\PROJECTS\DEV\ULTIMATE\attendancy-sys`

V2 a introduit de bons patterns techniques depuis la dernière synchro. Cet
inventaire liste ce qui est jugé bon à porter vers V1. Il servira ensuite de
base pour établir un prompt de migration et un plan — on n'y est pas encore.

Une sauvegarde de V1 existe déjà. Le dossier `src/app` de V1 est hors scope de
cet inventaire.

## Légende

- **`*`** — élément à copier tel quel, sans besoin de réadaptation.
- **`+`** — élément nécessitant une lecture de l'existant en V1 et une adaptation.

---

## Éléments jugés bons patterns en V2

### Schéma Prisma et migration Prisma 7

- `src/generated` — `*`
- `prisma/` — `*`

### Scripts

- `scripts/` — `*`

### Patterns Next.js 16.2.10

- `next.config.ts` : `cacheComponents: true`
- Suspense + gestion des chargements statique/dynamique : `src/components/layout/Header/AsyncHeader.tsx` — `+`
- Nouveau pattern de cache : `src/services/entity` (service d'exemple) — `+`

### Thème et style visuel

- `src/app/globals.css` — `*`
- `src/styles/` — `*`

### Nouveaux agents

- `docs/agents/` — `*`
- `.claude/` — `+`

### Documentation des nouvelles commandes

- `docs/cmd/` — `*`

### Micro-améliorations de service (exemple : `complete-signup.ts`)

- `src/services/auth/members/complete-signup.ts` — `+`
- usage de `logSignupAudit`
- contrat de retour discriminé `{ data: {...} } | { error: string }` plutôt que `{ success: boolean, error?: string }`
- `tx.user.upsert()` plutôt que `tx.user.create()`

### Système d'audit et structuration des fonctions utilitaires

- `src/utils/server/` — `*`
- adaptation des `try/catch` de contraintes au format Prisma 7 : `src/utils/server/prisma.ts` — `*` (déjà inclus dans le point précédent)

### Skills de service et frontend (gestion Suspense)

- `docs/skills/` — `*`

### Structuration des fonctions utilitaires

- `src/cache/` — `+`

---

## Patterns V2 introduits — session de migration (2026-07)

> Uniquement les éléments explicitement nouveaux en V2 (pas les corrections
> de régressions V2 qui s'inspiraient de la V1).

---

### 1. Système de cache centralisé (`src/cache/server/`)

**Fichiers V2 :** `src/cache/server/key.ts`, `src/cache/server/engine.ts`

**Pattern (`+`) :**

- Registre central `CACHE` : une entrée `key("x")` par entité cachée.
- `CACHE_GRAPH` : union des graphes de chaque service — mapping événement métier → tags à invalider.
- Dans les queries : `'use cache'` + `cacheTag(CACHE.X(scopeId))` + `cacheLife(CACHE.X.life)`.
- Dans les mutations : `invalidateEvent('X_EVENT', scopeId)` — jamais d'`invalidateCache` direct.
- Chaque service expose son `<SERVICE>_GRAPH` dans `<service>/cache.ts`, importé dans `key.ts`.

---

### 2. `ActionResponse` discriminé — retour d'actions serveur

**Fichiers V2 :** toutes les `actions/` de tous les services.

**Pattern (`*` principe, `+` par service) :**

```ts
// Retour toujours discriminé :
{ data: T } | { error: string }

// Narrowing côté appelant :
if ('error' in result) { /* erreur */ }

// Eviter si possible :
{ data?: T; error?: string }
if (result.error) { ... }
```

---

### 3. `ActionDeleteResponse` — `toDeleteFn` union

**Fichier V2 :** `src/hooks/entity/actionHelpers.ts` — `*`

```ts
export type ActionDeleteResponse = ActionResponse<boolean> | ActionSuccessResponse;
export function toDeleteFn<TId>(
  action: (id: TId) => Promise<ActionDeleteResponse>
): (id: TId) => Promise<void>
```

Union permettant la transition progressive entre l'ancienne forme `{ success: boolean }`
et la nouvelle `{ data: true } | { error: string }`.

---

### 4. Structure du module service — layering strict

**Pattern (`+` par service) :**

```
src/services/<name>/
  database/
    <name>.queries.ts     ← 'use cache' + cacheTag + cacheLife
    <name>.mutations.ts   ← invalidateEvent()
    index.ts
  actions/
    <name>.queries.ts     ← 'use server' + getUserInfo() + orgId token
    <name>.mutations.ts   ← 'use server' + validation Valibot
    index.ts
  cache.ts                ← <SERVICE>_GRAPH
  types.ts                ← Awaited<ReturnType<typeof fn>>
  validation.ts           ← schémas Valibot
  CLAUDE.md
  index.ts
```

Invariants :



---

### 5. Dérivation des types Prisma

**Fichiers V2 :** tous les `types.ts` de service — `*`

```ts
// TOUJOURS :
export type MyDto = Awaited<ReturnType<typeof myDbFn>>

// JAMAIS :
Prisma.PromiseReturnType<typeof fn>
```

---

### 6. Conventions de nommage — suppressions et lectures

**(`+` à appliquer partout en V1)**

| Opération | Préfixe | Événement cache |
|-----------|---------|-----------------|
| Soft delete (`deletedAt`) | `remove*` | `*_REMOVED` |
| Hard delete (row physique) | `delete*` | `*_DELETED` |
| Lecture | `get*` | — |



---

### 7. Validation Valibot dans `validation.ts` de chaque service

**Fichiers V2 :** `src/services/<name>/validation.ts` — `+`

```ts
import * as v from 'valibot'

export const createXSchema = v.object({
  name: v.pipe(v.string(), v.minLength(1)),
})

// Dans l'action :
const parsed = v.safeParse(createXSchema, input)
if (!parsed.success) return { error: '...' }
```

Valibot est le seul validateur en V2. Zod = interdit.

---

## Hors scope

- `src/app/` en V1 — supprimable, une sauvegarde existe déjà.
- `src/services/user/` en V2 — bypass explicite.
- `weekly-template` — service V2-only, pas d'équivalent V1.

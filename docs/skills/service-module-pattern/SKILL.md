---
name: service-module-pattern
description: Convention des modules sous src/services/ (actions/database/validation/types/cache/index). Utiliser AVANT d'écrire, modifier ou refactorer du code dans src/services/ — créer un service, ajouter une action serveur, placer une requête Prisma, ou décider où va la logique métier.
---

# Pattern des services (`src/services/<module>/`)

Référence vivante : [src/services/entity/](../../../src/services/entity/) (exemple commenté).
Réflexion domaine : voir [`src/services/SERVICE_CONTEXT.md`](../../../src/services/SERVICE_CONTEXT.md).

## Règle d'or

**1 modèle Prisma = 1 service.** Pas de sous-entités, pas de modèles croisés.
`prisma.<model>` ne vit que dans le service propriétaire de ce modèle.

## Arborescence cible

```
src/services/<module>/
  CLAUDE.md              # Contexte du service : rôle, fichiers, extensions, invariants
  index.ts               # Barrel : export * actions + types — JAMAIS database
  actions/               # JAMAIS actions.ts à la racine — toujours ce dossier
    index.ts             # Barrel : export * de tous les fichiers d'actions
    <model>.mutations.ts # "use server" — mutations serveur
    <model>.queries.ts   # "use server" — lectures (wrappent auth + orgId)
  database/
    index.ts             # Barrel : export * queries + mutations
    <model>.queries.ts   # Lectures Prisma + "use cache" + cacheTag + cacheLife
    <model>.mutations.ts # Écritures Prisma + invalidateEvent

    ## Optionnels, créer au besoin :
    <model>.analytics.ts # Fonctions légères liées aux statistiques
    <model>.rpc.ts       # Appels de fonctions RPC (Supabase)

  cache.ts               # <SERVICE>_GRAPH : événement → tags à invalider
  constants.ts           # Constantes du domaine (enums, labels, valeurs par défaut)
  validation.ts          # Schémas Valibot (jamais Zod)
  types.ts               # DTOs : Awaited<ReturnType<typeof fn>>
```

## Couches

### `actions/<model>.queries.ts` — lectures exposées au frontend

- `"use server"` en tête de fichier.
- Fait : `getUserInfo` (auth) → `orgId` depuis token UNIQUEMENT → appel `database/`
  → retour `{ data }` / `{ error: string }`.
- Préfixe **`get`** (jamais `list`), suffixe **`Action`** : `getEntitiesAction`.
- Les ids métier (`entityId`…) arrivent en paramètre — l'action ne résout
  jamais son propre contexte métier (SERVICE_CONTEXT §5-6).

```ts
'use server'
import { getUserInfo } from '@/services/user/userInfo'
import { ERRORS } from '@/config'
import { getEntities } from '../database'

export async function getEntitiesAction() {
  try {
    const user = await getUserInfo()
    const orgId = user?.organization?.id
    if (!orgId) return { error: ERRORS.ORG.NOT_FOUND }
    return { data: await getEntities(orgId) }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}
```

### `actions/<model>.mutations.ts` — écritures

- Même directive, même retour `{ data }` / `{ error }`.
- Ordre : auth → orgId → `getAuthorization` (rôle) → `v.parse` (Valibot) →
  `database/` → audit si critique.
- Pas de Prisma direct. Pas de logique métier — orchestre seulement.

### Audit log — actions critiques

**Fire-and-forget** : `logAuditAsync` ne bloque pas la réponse.
Appelé **après** le retour de la mutation, avant le `return { data }`.

**Quand auditer :** `DELETE`/`remove*` toujours ; `UPDATE` sensible ; `CREATE` critique.
**Quand ne pas auditer :** `CREATE` courant ; queries — jamais.

### `database/<model>.queries.ts` — lectures

- `"use cache"` comme première instruction du corps de fonction.
- `cacheTag()` + `cacheLife()` depuis `@/cache/server/key`.
- Tags : `CACHE.<KEY>(orgId)` pour la liste, + `CACHE.<KEY>(orgId, id)` pour le détail.
- `select` explicite — jamais `findMany({})` sans select.
- `deletedAt: null` dans `where` si le modèle a soft-delete.
- Verbes : `get<Model>` (détail) / `get<Models>` (liste).
- Paramètres contextuels : `entityId`, pas `id`.

### `database/<model>.mutations.ts` — écritures

- `tryConstraint()` autour de chaque appel Prisma (erreurs DB lisibles).
- `invalidateEvent('EVENT_NAME', orgId, id?)` après chaque mutation réussie.
- `orgId` dans le `where` (multi-tenant strict).
- `remove*` = soft delete (`deletedAt: new Date()`), `delete*` = hard delete (rare).
- Pas de `Promise<>` explicite — TypeScript infère.

### `cache.ts`

- `<SERVICE>_GRAPH` : map événement → tableau de tags à invalider.
- Importé dans `src/cache/server/key.ts` et spreadé dans `CACHE_GRAPH`.
- Cross-service : invalider aussi les tags des services dont les queries
  incluent cette donnée dans leur `select`.

### `constants.ts`

- Constantes enum : `as const satisfies readonly EnumType[]` — vérif compile-time.
- Labels : `Record<ConstantType, string>`.

### `validation.ts`

- **Valibot uniquement** — jamais Zod.
- IDs : `pipe(string(), uuid('Message'))` — tous les IDs sont UUID.
- Toujours exporter **`InferInput` et `InferOutput`** pour chaque schéma :

```ts
import * as v from 'valibot'

export const CreateEntitySchema = v.object({
  name: v.pipe(v.string(), v.trim(), v.minLength(1)),
  // ...champs du modèle
})

// Input  = ce que l'UI envoie (avant transformations — ex. trim, coerce)
// Output = ce que le service reçoit après v.parse() (valeurs transformées)
export type CreateEntityInput  = v.InferInput<typeof CreateEntitySchema>
export type CreateEntityOutput = v.InferOutput<typeof CreateEntitySchema>
```

- L'action accepte `Input` comme paramètre — le formulaire est typé côté UI.
- Après `v.parse()` la valeur locale est typée `Output` — plus précis que `Input`.
- **Jamais `input: unknown`** sur une action ��� toujours le type `Input` du schéma.

```ts
// ✅ correct
export async function createEntityAction(input: CreateEntityInput) {
  const parsed = v.parse(CreateEntitySchema, input) // parsed: CreateEntityOutput
  ...
}

// ❌ à éviter
export async function createEntityAction(input: unknown) { ... }
```

### `types.ts`

- Naming : **nom de la fonction + `Dto`** — ex. `getEntity` → `GetEntityDto`.
- `Awaited<ReturnType<typeof fn>>` — inféré depuis la query, aligné sur le `select`.
- Générable : `npx tsx scripts/generate/types/types.ts <service>`.

### `CLAUDE.md`

- Rôle, table des fichiers, points d'extension (⚠), invariants.
- Mis à jour à CHAQUE évolution du service — il fait partie du livrable.

### `index.ts` (racine)

```ts
export * from './actions'
// database/ est interne au service — jamais exporté
export * from './types'
```

## Contraintes absolues

- `orgId` extrait du token serveur UNIQUEMENT — jamais du body/query/headers.
- Tout `where` Prisma scopé par `orgId` (multi-tenant strict).
- TypeScript strict — jamais `any`. Inférer depuis le code existant.
- `"use server"` uniquement dans `actions/` — jamais sur les utilitaires.
- Prisma uniquement dans `database/` — jamais dans les actions ou composants.
- **`database/` est interne au service** — jamais importé en dehors de
  `src/services/<module>/`. Ni pages, ni composants, ni hooks.
- **Tout le frontend (pages RSC incluses) appelle uniquement `actions/`** —
  c'est la couche qui porte l'auth, l'orgId et le scoping multi-tenant.
- **Jamais de `actions.ts` à la racine d'un service** — uniquement le dossier
  `actions/`. (Exception unique : services d'infrastructure sans modèle, comme
  `auth` — documentée dans leur CLAUDE.md.)
- **Jamais de type de retour explicite `Promise<...>` sur les actions** —
  laisser TypeScript inférer.
- Pas d'imports/variables inutilisés.
- Variables locales : `entity_` quand le nom naturel est un mot réservé.

## Checklist nouveau service

1. `database/<model>.queries.ts` — lectures avec `"use cache"`.
2. `database/<model>.mutations.ts` — écritures avec `invalidateEvent`.
3. `database/index.ts` — `export *`.
4. `cache.ts` — `<SERVICE>_GRAPH` + enregistrement dans `src/cache/server/key.ts`.
5. `constants.ts` — si enums ou labels.
6. `validation.ts` — schémas Valibot pour les entrées mutables.
7. `actions/<model>.queries.ts` + `actions/<model>.mutations.ts`.
8. `actions/index.ts` — `export *`.
9. `types.ts` — DTOs `<FnName>Dto` (ou générateur).
10. `index.ts` — barrel racine (actions + types).
11. `CLAUDE.md` — contexte du service.
12. Ownership dans `SERVICE_CONTEXT.md` + régénérer `.api/`.

## Anti-patterns

- Prisma dans pages/composants/actions.
- `orgId` oublié dans un `where`.
- `id` comme nom de paramètre sans contexte (`entityId`, `parentId`, etc.).
- `softDelete*` comme nom de fonction (utiliser `remove*`).
- `any` ou type manuel au lieu d'inférer depuis la query.
- `database.ts` ET dossier `database/` coexistants (shadowing Node).
- Mutation cachée derrière un nom `get*`.
- Préfixe `list*` sur une action (toujours `get*`).
- Sous-entités dans un service — chaque modèle a son propre service.
- Import de `database/` en dehors du service.
- `actions.ts` à la racine d'un service à modèle.
- Service sans `CLAUDE.md` ou avec un `CLAUDE.md` obsolète.

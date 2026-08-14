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
- Fait : auth (via `authAccess` par défaut) → `orgId` depuis token UNIQUEMENT
  → appel `database/` → retour `{ data }` / `{ error: string }`.
- Préfixe **`get`** (jamais `list`), suffixe **`Action`** : `getEntitiesAction`.
- Les ids métier (`entityId`…) arrivent en paramètre — l'action ne résout
  jamais son propre contexte métier (SERVICE_CONTEXT §5-6).

```ts
'use server'
import { authAccess } from '@/modules/auth'
import { ERRORS } from '@/config'
import { getEntities } from '../database'

export async function getEntitiesAction() {
  const auth = await authAccess()
  if (!auth.data) return { error: auth.error }
  const { orgId } = auth.data

  try {
    return { data: await getEntities(orgId) }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}
```

### `actions/<model>.mutations.ts` — écritures

- Même directive, même retour `{ data }` / `{ error }`.
- Ordre : auth (via `authAccess` par défaut, ou `getUserInfo` +
  `getAuthorization` composés à la main si le cas le justifie) →
  `v.safeParse` (Valibot) → `database/` → audit si critique.
- Pas de Prisma direct. Pas de logique métier — orchestre seulement.

```ts
'use server'
import * as v from 'valibot'
import { authAccess } from '@/services/auth'
import { createEntitySchema } from '../validation'
import type { CreateEntityInput } from '../validation'
import { createEntity } from '../database'

// ✅ correct
export async function createEntityAction(input: CreateEntityInput) {
  const auth = await authAccess({ requiredRole: 'DIRECTION' })
  if (!auth.data) return { error: auth.error }
  const { orgId } = auth.data

  const parsed = v.safeParse(createEntitySchema, input)
  if (!parsed.success) return { error: parsed.issues[0]?.message ?? 'Données invalides' }
  // parsed.output: CreateEntityOutput

  const entity = await createEntity({ ...parsed.output, orgId })
  return { data: entity }
}

// ❌ à éviter
export async function createEntityAction(input: unknown) { ... }
```

#### Update — id + payload validés ensemble

- Norme V2 : l'action `update` reçoit `{ <model>Id, data }` — jamais l'id
  et le payload séparés en deux paramètres de fonction.
- L'`Input` de l'action est le type **englobant** exporté par
  `validation.ts` (`UpdateEntityInput`, id compris) — jamais
  `{ entityId: string; data: unknown }`. Le compilateur doit pouvoir
  vérifier la forme de l'appel côté hook, avant même `v.safeParse`.
- Un seul `v.safeParse` sur l'input entier (id + data) — l'id ne doit
  jamais traverser l'action comme simple `string` non vérifiée.

```ts
'use server'
import * as v from 'valibot'
import { authAccess } from '@/services/auth'
import { updateEntitySchema } from '../validation'
import type { UpdateEntityInput } from '../validation'
import { updateEntity } from '../database'

// ✅ correct — id validé (uuid) au même titre que data
export async function updateEntityAction(input: UpdateEntityInput) {
  const auth = await authAccess({ requiredRole: 'DIRECTION' })
  if (!auth.data) return { error: auth.error }
  const { orgId } = auth.data

  const parsed = v.safeParse(updateEntitySchema, input)
  if (!parsed.success) return { error: parsed.issues[0]?.message ?? 'Données invalides' }
  // parsed.output: { entityId: string; data: UpdateEntityDataOutput }

  const entity = await updateEntity(parsed.output.entityId, orgId, parsed.output.data)
  return { data: entity }
}

// ❌ à éviter — id non typé/non validé, data non typée
export async function updateEntityAction(input: { entityId: string; data: unknown }) { ... }
```

### `authAccess` — helper d'auth pour le cas courant

Couvre le cas standard : auth + `orgId` + rôle/fonction requis en un appel.
À privilégier par défaut dans `actions/` — évite de recomposer
`getUserInfo` + `getAuthorization` à chaque fois.

```ts
import { authAccess } from '@/services/auth'

const auth = await authAccess({ requiredRole: 'DIRECTION', requiredFunction: 'PRINCIPAL' })
if (!auth.data) return { error: auth.error }
const { user, orgId } = auth.data // user: AuthenticatedUser, orgId: string
```

- Toujours discriminer avec `if (!auth.data)` — jamais `if (auth.error)`.
- Sans `requiredRole`/`requiredFunction` : vérifie uniquement auth + orgId.
- `auth.data.user` est un `AuthenticatedUser` (id/role/function/name/email
  garantis non-`undefined`) — pas besoin de `?.` dessus.

**Quand ne pas l'utiliser** — composer `getUserInfo` + `getAuthorization`
directement si :
- l'action n'exige pas d'`orgId` (rare, ex. auth simple sans scope org) —
  `authAccess` échoue toujours si `orgId` est absent ;
- la logique d'autorisation ne suit pas le schéma
  `auth → orgId → rôle` (ex. checks conditionnels, plusieurs rôles
  évalués séparément selon le flux) ;
- un besoin ponctuel de contrôle fin sur l'ordre des vérifications.

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
- `update<Model>` prend `(entityId, orgId, data)` en paramètres séparés —
  `data` est typé `UpdateEntityDataOutput` (le payload seul, sans id),
  jamais `UpdateEntityOutput` (qui désigne la forme englobante
  `{ entityId, data }` côté validation — cf. `validation.ts`).

```ts
// reçoit directement le type Output de validation.ts
import { prisma } from '@/lib/prisma'
import { tryConstraint } from '@/utils/server/prisma'
import { invalidateEvent } from '@/cache/server/key'
import type { CreateEntityOutput } from '../validation'

export async function createEntity(data: CreateEntityOutput & { orgId: string }) {
  const entity = await tryConstraint(prisma.entity.create({
    data,
    select: { id: true, name: true },
  }))

  await invalidateEvent('ENTITY_CREATED', data.orgId)
  return entity
}
```

```ts
// update — data typé UpdateEntityDataOutput (payload seul, sans id)
import type { UpdateEntityDataOutput } from '../validation'

export async function updateEntity(entityId: string, orgId: string, data: UpdateEntityDataOutput) {
  const entity = await tryConstraint(prisma.entity.update({
    where: { id: entityId, orgId },
    data,
    select: { id: true, name: true },
  }))

  await invalidateEvent('ENTITY_UPDATED', orgId, entityId)
  return entity
}
```

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
- Schéma typé par `types.ts` : `satisfies Record<keyof CreateEntityData, unknown>` — toute divergence avec le modèle Prisma casse la compilation.
- Champ optionnel/nullable en DB → `v.optional(v.nullable(...))`.
- Champ JSON : pas de `v.nullable()` — Prisma type le null JSON via un sentinel (`NullableJsonNullValueInput`), pas `null` littéral.
- Toujours exporter **`InferInput` et `InferOutput`** pour chaque schéma.

```ts
import * as v from 'valibot'
import type { Prisma } from '@/generated/prisma/client'
import type { CreateEntityData, UpdateEntityData } from './types'

const jsonValue = v.custom<Prisma.InputJsonValue>(() => true) // JSON libre, pas de schéma de forme imposé

export const createEntitySchema = v.object({
  name: v.pipe(v.string(), v.trim(), v.minLength(1, 'Nom requis'), v.maxLength(100)),
  code: v.optional(v.nullable(v.pipe(v.string(), v.trim(), v.maxLength(20)))),
  credits: v.pipe(v.number(), v.minValue(1), v.maxValue(10)),
  parentId: v.pipe(v.string(), v.uuid('ID invalide')),
  settings: v.optional(jsonValue),
} satisfies Record<keyof CreateEntityData, unknown>)

export type CreateEntityInput  = v.InferInput<typeof createEntitySchema>  // Input UI
export type CreateEntityOutput = v.InferOutput<typeof createEntitySchema> // Output validé
```

#### Update — `validateWithId` (norme V2)

Un update touche toujours deux choses de nature différente : un **id**
(identité, jamais un champ métier) et un **payload** (champs métier
modifiables, tous `optional`). Ces deux éléments sont validés **ensemble**,
dans un seul `v.safeParse`, via le helper `validateWithId` :

```ts
// @/utils/server/validation.ts
export function validateWithId<
  const TIdField extends string,
  TDataSchema extends v.GenericSchema
>(idField: TIdField, dataSchema: TDataSchema) { /* ... */ }
```

- **Deux schémas exportés, jamais un seul** :
  1. `update<Entity>DataSchema` — le **payload seul** (sans id), typé
     Prisma via `satisfies Record<keyof UpdateEntityData, unknown>`, tous
     champs `optional` (update partiel).
  2. `update<Entity>Schema` — le schéma **englobant**, construit via
     `validateWithId('<entity>Id', update<Entity>DataSchema)`. C'est LUI
     que l'action passe à `v.safeParse`.
- **Quatre types exportés** pour l'update, pas deux :
  `UpdateEntityDataInput` / `UpdateEntityDataOutput` (payload seul) et
  `UpdateEntityInput` / `UpdateEntityOutput` (forme englobante
  `{ entityId, data }`). Ne jamais réutiliser le même nom pour les deux
  formes ailleurs dans le service (hooks compris) — cf. anti-pattern
  dédié plus bas.
- `entityId` n'appartient jamais à `UpdateEntityData` (dérivé de Prisma,
  ne contient jamais l'id) — c'est pour ça qu'il est validé à part, dans
  le schéma englobant, pas dans le schéma data.

```ts
export const updateEntityDataSchema = v.object({
  name: v.optional(v.pipe(v.string(), v.trim(), v.minLength(1, 'Nom requis'), v.maxLength(100))),
  code: v.optional(v.nullable(v.pipe(v.string(), v.trim(), v.maxLength(20)))),
  credits: v.optional(v.pipe(v.number(), v.minValue(1), v.maxValue(10))),
  parentId: v.optional(v.pipe(v.string(), v.uuid('ID invalide'))),
  settings: v.optional(jsonValue),
} satisfies Record<keyof UpdateEntityData, unknown>)

export type UpdateEntityDataInput  = v.InferInput<typeof updateEntityDataSchema>
export type UpdateEntityDataOutput = v.InferOutput<typeof updateEntityDataSchema>

export const updateEntitySchema = validateWithId('entityId', updateEntityDataSchema)

export type UpdateEntityInput  = v.InferInput<typeof updateEntitySchema>  // { entityId: string; data: UpdateEntityDataInput }
export type UpdateEntityOutput = v.InferOutput<typeof updateEntitySchema> // { entityId: string; data: UpdateEntityDataOutput }
```

- L'action accepte `UpdateEntityInput` (forme englobante) comme paramètre
  — jamais `{ entityId: string; data: unknown }`.
- Après `v.safeParse()` réussi, `parsed.output.entityId` et
  `parsed.output.data` sont typés précisément — passés séparément à
  `database/` (`updateEntity(entityId, orgId, data)`), jamais en un seul
  objet imbriqué côté DB.
- **Jamais `input: unknown`** sur une action — toujours le type `Input` du schéma.
- Format attendu : `v.safeParse`, pas `v.parse`.

### `types.ts`

- Naming DTO : **nom de la fonction + `Dto`** — ex. `getEntity` → `GetEntityDto`.
- `generated.types.ts` : auto-généré (`npx tsx scripts/generate/types/types.ts <service>`), source des DTOs de lecture.
- `types.ts` : re-export des générés + types manuels — notamment `CreateEntityData`/`UpdateEntityData`, dérivés de Prisma, qui typent ensuite `validation.ts`.

```ts
// generated.types.ts
import { getEntities } from './database'

export type GetEntitiesDto = Awaited<ReturnType<typeof getEntities>>
```

```ts
// types.ts
export * from './generated.types'

import type { Prisma } from '@/generated/prisma/client'

export type CreateEntityData = Pick<
  Prisma.EntityUncheckedCreateInput,
  'name' | 'code' | 'credits' | 'parentId' | 'settings'
>
export type UpdateEntityData = Partial<CreateEntityData>
```

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
- **Update : id + data validés dans un seul `v.safeParse`**, via
  `validateWithId` — jamais deux paramètres de fonction séparés
  (`(entityId: string, data: unknown)`) sur une action.
- Pas d'imports/variables inutilisés.
- Variables locales : `entity_` quand le nom naturel est un mot réservé.

## Checklist nouveau service

1. `database/<model>.queries.ts` — lectures avec `"use cache"`.
2. `database/<model>.mutations.ts` — écritures avec `invalidateEvent`.
3. `database/index.ts` — `export *`.
4. `cache.ts` — `<SERVICE>_GRAPH` + enregistrement dans `src/cache/server/key.ts`.
5. `constants.ts` — si enums ou labels.
6. `validation.ts` — schémas Valibot pour les entrées mutables (update via `validateWithId`).
7. `actions/<model>.queries.ts` + `actions/<model>.mutations.ts`.
8. `actions/index.ts` — `export *`.
9. `types.ts` — DTOs `<FnName>Dto` .
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
- `v.parse` dans une action (préférer `v.safeParse` pour un retour d'erreur explicite).
- `if (auth.error)` au lieu de `if (!auth.data)` pour discriminer le retour de `authAccess`.
- **Update sans `validateWithId`** : id passé en `string` brute non validée
  au lieu d'être vérifiée `uuid()` au même titre que `data`.
- **`data: unknown`** (ou tout paramètre d'action non typé par l'`Input`
  du schéma) — le compilateur doit pouvoir vérifier l'appel avant même
  `v.safeParse`.
- **Réutiliser le même nom de type pour la forme englobante et le payload
  seul** d'un update (ex. `UpdateEntityInput` désignant tantôt
  `{ entityId, data }`, tantôt juste les champs métier selon le fichier) —
  toujours distinguer `UpdateEntityInput`/`Output` (englobant) de
  `UpdateEntityDataInput`/`DataOutput` (payload seul).
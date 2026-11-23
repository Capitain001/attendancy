# Migration vers `@attendancy/user` — Ré-exports transitoires à retirer (étape 3)

Ce document recense les ré-exports temporaires conservés dans `apps/web` et les exports dans `@attendancy/types` suite à la création du package `@attendancy/user` (cf. [docs/tasks/task-pakage-user.md](../tasks/task-pakage-user.md)).

Règle pour tout nouveau code : importer directement depuis `@attendancy/user`.

---

## 1. Ré-exports transitoires dans `apps/web/src`

À supprimer une fois les imports existants de `apps/web` migrés vers `@attendancy/user` :

### `apps/web/src/types/user.ts` (lignes 11–29)
Symboles ré-exportés depuis `@attendancy/user` :
- Valeurs : `APP_METADATA_KEYS`, `Functions`, `ROLES`, `USER_METADATA_KEYS`, `UserRoles`, `UserStatus`
- Types : `AppMetadata`, `AppMetadataKey`, `AuthMetadata`, `AuthenticatedUser`, `InvitedBy`, `Organization`, `PresenceUser`, `Role`, `UserInfo`, `UserMetadata`, `UserMetadataKey`

Ce qui reste propre à `apps/web` dans ce fichier :
- `UserMetadataPatch`, `AppMetadataPatch`
- `SENSITIVE_USER_KEYS`, `SENSITIVE_ORGANIZATION_KEYS`, `PublicOrganization`, `PublicUserInfo`
- `SupabaseUser`

### `apps/web/src/config/data.ts` (lignes 15–21)
Symboles ré-exportés depuis `@attendancy/user` :
- Valeurs : `FUNCTIONS`, `MAIN_FUNCTIONS`, `isSuperAdmin`
- Types : `FunctionName`, `MainFunction`

Ce qui reste propre à `apps/web` dans ce fichier :
- `RESOURCE_ICONS`, `ResourceIconName`, `CONFIG`, `RESOURCE_BASE_PATH`

### `apps/web/src/modules/user/utils.ts` (ligne 4)
Symboles ré-exportés depuis `@attendancy/user` :
- `mapUserInfo`

Ce qui reste propre à `apps/web` dans ce fichier :
- `generateUserInfo`, `superAdminStatus`, `checkSuperAdminStatus`

### `apps/web/src/lib/map.ts` (ligne 23)
Symboles ré-exportés depuis `@attendancy/user` :
- `pickKeys`

Ce qui reste propre à `apps/web` dans ce fichier :
- `withName`, `PartialExcept`, `hasId`

### `apps/web/src/modules/auth/rpc/utils.ts` (ligne 2)
Symboles ré-exportés depuis `@attendancy/user` :
- `RPC_USER_KEYS`, `mapUserRpc`, `type RpcUser`

Le fichier entier peut être supprimé une fois que `apps/web/src/modules/auth/rpc/actions.ts` et `apps/web/src/lib/rpc/contract.ts` importeront directement depuis `@attendancy/user`.

---

## 2. Exports dans `@attendancy/types` (`apps/web/src/lib/rpc/contract.ts`)

Le contrat génère `packages/types/dist/contract.d.mts` via `bun run --filter @attendancy/types build:types`.

Dans `apps/web/src/lib/rpc/contract.ts` (lignes 27–28 et 34–39) :
- `RpcUser` : actuellement importé depuis `@/modules/auth/rpc/utils` et ré-exporté dans `contract.d.mts` (utilisé notamment dans le type de retour de `getCurrentUserAction`).
  - À terme : soit migrer son import vers `@attendancy/user` si le contrat RPC le conserve en signature, soit le retirer des exports de `contract.ts` si les consommateurs lisent directement `@attendancy/user`.
- `UserInfo`, `UserStatus` : actuellement importés depuis `@/types/user` et ré-exportés dans `contract.d.mts`.
  - À nettoyer/aligner de la même manière une fois les consommateurs migrés sur `@attendancy/user`.

---

## 3. Vérification lors du retrait

Après chaque suppression de ré-export et migration d'imports :

```bash
bun run --filter @attendancy/types build:types
bun run --cwd apps/web check-types
bun run --cwd packages/auth check-types
bun run --cwd apps/chat build
bun run --cwd apps/teacher check-types
```

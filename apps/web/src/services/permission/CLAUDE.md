# Service : permission

Gère les permissions granulaires d'une organisation (attribuées soit à un utilisateur, soit à une fonction).
1 modèle Prisma : `Permission`.

## Fichiers

| Fichier | Rôle |
|---------|------|
| `actions/permission.mutations.ts` | `grantPermissionAction`, `revokePermissionAction` |
| `actions/permission.queries.ts` | `getUserPermissionsAction`, `getCurrentUserPermissionsAction`, `getFunctionPermissionsAction`, `getEffectivePermissionNamesAction`, `getCurrentUserEffectivePermissionNamesAction` |
| `actions/index.ts` | Barrel exports des actions |
| `cache.ts` | `PERMISSION_GRAPH` — enregistré dans `src/cache/server/graph.ts` |
| `constants.ts` | `ACTION_LABELS`, `RESOURCE_LABELS` |
| `database/permission.mutations.ts` | `grantPermission`, `revokePermission` (soft revoke via `isActive: false`) |
| `database/permission.queries.ts` | `getUserPermissions`, `getFunctionPermissions`, `getEffectivePermissionNames` |
| `database/index.ts` | Barrel interne (non exporté) |
| `server.ts` | Surface serveur pour les autres modules : `getEffectivePermissionNames` uniquement (lu par `authAccess`) |
| `index.ts` | Point d'entrée du service (export actions, types, constants, utils, validation) |
| `types.ts` | DTOs et types du domaine (`PermissionName`, `CreatePermissionData`, `UpdatePermissionData`, DTOs de lecture) |
| `utils.ts` | `permissionName`, `parsePermissionName`, `permissionLabel`, `hasPermission`, `hasAnyPermission`, `hasAllPermissions` |
| `validation.ts` | `grantPermissionSchema`, `revokePermissionSchema`, `getUserPermissionsSchema`, `getFunctionPermissionsSchema` |

## Invariants

- XOR strict entre `userId` et `functionId` : une permission est soit assignée à un utilisateur, soit à une fonction, jamais les deux.
- Un `resourceId` exige une `resource` (sinon la ligne se lirait comme un droit sur toutes les ressources) — validation + contrainte DB.
- `orgId` extrait du token serveur UNIQUEMENT — jamais du body/query/headers.
- Révocation = soft revoke (`isActive: false`), préserve l'historique d'attribution.
- Seul `ADMIN` peut attribuer/révoquer ou inspecter les permissions ciblées d'un autre utilisateur/fonction.
- L'utilisateur connecté peut inspecter ses propres permissions (`getCurrentUserPermissionsAction`, `getCurrentUserEffectivePermissionNamesAction`).

## Évaluation des droits

- Source de vérité : la base. Le JWT ne porte AUCUNE permission.
- `getEffectivePermissionNames(userId, orgId)` = permissions directes + héritées des fonctions assignées, en une requête mise en cache (tags `PERMISSION(orgId)` et `PERMISSION(orgId, userId)`). L'expiration (`expiresAt`) est jugée à chaque lecture, jamais figée dans le cache.
- Vérification : `authAccess({ requiredPermission })` lit cette liste (dédupliquée par requête) et la passe à `hasPermission` (fonction pure, `utils.ts`). Le bypass `SUPER_ADMIN` s'applique avant la lecture.
- Portée de `hasPermission` : droit exact → toute la ressource → toutes les ressources (action seule) ; `CRUD` couvre les quatre actions ; un droit plus fin ne remonte jamais.

## Invalidation

- `PERMISSION_GRANTED` / `PERMISSION_REVOKED` : tag d'organisation + tag de la cible (utilisateur ou fonction).
- Toute mutation qui change les droits effectifs d'un utilisateur DOIT émettre un événement qui expire `CACHE.PERMISSION(orgId, userId)` : assignation ou retrait de fonction (`FUNCTION_ASSIGNED`, `FUNCTION_UNASSIGNED`, `USER_FUNCTIONS_UPDATED`) ; suppression de fonction (`FUNCTION_DELETED`) expire le tag d'organisation.
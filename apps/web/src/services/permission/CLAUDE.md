# Service : permission

Gère les permissions granulaires d'une organisation (attribuées soit à un utilisateur, soit à une fonction).
1 modèle Prisma : `Permission`.

## Fichiers

| Fichier | Rôle |
|---------|------|
| `actions/permission.mutations.ts` | `grantPermissionAction`, `revokePermissionAction` |
| `actions/permission.queries.ts` | `getUserPermissionsAction`, `getCurrentUserPermissionsAction`, `getFunctionPermissionsAction`, `getEffectivePermissionNamesAction`, `getCurrentUserEffectivePermissionNamesAction` |
| `actions/index.ts` | Barrel exports des actions |
| `cache.ts` | `PERMISSION_GRAPH` — enregistré dans `src/cache/server/key.ts` |
| `constants.ts` | `ACTION_LABELS`, `RESOURCE_LABELS` |
| `database/permission.mutations.ts` | `grantPermission`, `revokePermission` (soft revoke via `isActive: false`) |
| `database/permission.queries.ts` | `getUserPermissions`, `getFunctionPermissions`, `getEffectivePermissionNames` |
| `database/index.ts` | Barrel interne (non exporté) |
| `index.ts` | Point d'entrée du service (export actions, types, constants, utils, validation) |
| `types.ts` | DTOs et types du domaine (`PermissionName`, `CreatePermissionData`, `UpdatePermissionData`, DTOs de lecture) |
| `utils.ts` | `permissionName`, `parsePermissionName`, `permissionLabel`, `hasPermission`, `hasAnyPermission`, `hasAllPermissions` |
| `validation.ts` | `grantPermissionSchema`, `revokePermissionSchema`, `getUserPermissionsSchema`, `getFunctionPermissionsSchema` |

## Invariants

- XOR strict entre `userId` et `functionId` : une permission est soit assignée à un utilisateur, soit à une fonction, jamais les deux.
- `orgId` extrait du token serveur UNIQUEMENT — jamais du body/query/headers.
- Révocation = soft revoke (`isActive: false`), préserve l'historique d'attribution.
- Seul `ADMIN` peut attribuer/révoquer ou inspecter les permissions ciblées d'un autre utilisateur/fonction.
- L'utilisateur connecté peut inspecter ses propres permissions (`getCurrentUserPermissionsAction`, `getCurrentUserEffectivePermissionNamesAction`).
- Évaluation rapide des permissions via les helpers purs dans `utils.ts` adossés au cache JWT (`organization.permissions`).

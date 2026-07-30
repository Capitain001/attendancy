# Service `users`

## Rôle

Gestion des membres d'organisation (lecture) : stats par rôle, profils avec fonctions,
membres par rôle/fonction. Distinct du service `user` (identité du current user).

## Fichiers

| Fichier | Rôle |
|---|---|
| `database/users.queries.ts` | Prisma — `getUserRoleStats`, `getUserProfile`, `getUsersByRoles`, `getFunctionProfiles` |
| `database/index.ts` | Barrel |
| `stats.ts` | Export `getUserRoleStats` + type `UserRoleStats` |
| `actions.ts` | `getUserRoleStatsAction` |
| `profile/database.ts` | (réservé) |
| `profile/actions.ts` | `getUserProfileAction`, `getUsersByRolesAction`, `getFunctionProfilesAction` |
| `profile/types.ts` | DTOs dérivés via `Awaited<ReturnType<>>` |
| `profile/validation.ts` | `userIdSchema`, `rolesSchema`, `functionIdSchema` |
| `profile/index.ts` | Barrel profile |
| `index.ts` | Barrel racine |

## Invariants

- `orgId` extrait du token — jamais de l'input.
- Cache tagué `CACHE.ORG(orgId)` — invalidé lors des mutations org (invite, auth).
- `UserOrganization.role` = rôle grossier ; `UserFunction` = RBAC fin (fonctions).
- `UserProfile.functions` filtrées par `orgId` de la `Function` pour isoler les fonctions de l'org.
- Ce service ne fait que lire — pas de mutations (les mutations passent par `invite/` ou `auth/`).

# Service : group

Gère les groupes TD/TP d'une classe — `Group`.

## Particularité multi-tenant

`Group` n'a pas de `orgId`. Org scoping via `class: { programTrack: { orgId } }`.
- `createGroup` : findFirst ownership check sur Class avant création
- `deleteGroup` : findFirst avec `class: { programTrack: { orgId } }` avant soft delete

## Cache

Groups sont inclus dans le select de `getClass` (class service). GROUP mutations
invalident donc `CACHE.CLASS(orgId, classId)` — pas de CACHE.GROUP séparé.

## Fichiers

| Fichier | Rôle |
|---------|------|
| `database/group.queries.ts` | `getGroupsByClass`, `getGroupEligibleStudents` (inscriptions + flag `inGroup`) |
| `database/group.mutations.ts` | `createGroup`, `updateGroup`, `removeGroup` (soft delete), `setGroupStudents` |
| `cache.ts` | `GROUP_GRAPH` → invalide CACHE.CLASS + CACHE.GROUP |
| `validation.ts` | `createGroupSchema`, `updateGroupSchema`, `setGroupStudentsSchema` |
| `actions/group.queries.ts` | `getGroupsByClassAction`, `getClassGroupsAction` (groupes + info classe), `getGroupEligibleStudentsAction` |
| `actions/group.mutations.ts` | `createGroupAction`, `updateGroupAction`, `removeGroupAction`, `setGroupStudentsAction` |

## Invariants

- Soft delete obligatoire — `Schedule.group` Restrict bloque le hard delete si séances liées
- `removeGroup` : vérification ownership avant soft delete (findFirst avec orgId)
- `getClassGroupsAction` compose l'info classe via l'action propriétaire `getClassAction`
  (service `class`) — jamais de `prisma.class` en lecture de payload ici.
- `getGroupEligibleStudents` lit `StudentEnrollment` (join membership) scopé par
  `class.programTrack.orgId` ; `groupId` est un arg → clé de cache `'use cache'` par groupe.
- `setGroupStudents` : set transactionnel (`deleteMany` + `createMany`) après garde ownership.

## Fichiers

| Fichier | Rôle |
|---------|------|
| `actions/group.mutations.ts` | Écritures serveur (Validation + AuthGuard) |
| `actions/group.queries.ts` | Lectures serveur exposées au frontend |
| `actions/index.ts` | Barrel exports des actions |
| `cache.ts` | <SERVICE>_GRAPH : événement → tags à invalider |
| `database/group.mutations.ts` | Requêtes Prisma (tryConstraint + invalidateEvent) |
| `database/group.queries.ts` | Requêtes Prisma (lectures avec cache) |
| `database/index.ts` | Barrel interne (non exporté) |
| `generated.types.ts` | Types générés automatiquement (DTOs de lecture) |
| `index.ts` | Point d'entrée du service (export actions + types) |
| `types.ts` | DTOs et types du domaine |
| `validation.ts` | Schémas Valibot |

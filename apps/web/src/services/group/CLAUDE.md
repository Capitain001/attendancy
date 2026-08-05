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
| `database/group.queries.ts` | `getGroupsByClass` — liste tagguée sur CACHE.CLASS |
| `database/group.mutations.ts` | `createGroup`, `deleteGroup` (soft delete) |
| `cache.ts` | `GROUP_GRAPH` → invalide CACHE.CLASS |
| `validation.ts` | `createGroupSchema` |
| `actions/group.queries.ts` | `getGroupsByClassAction(classId)` |
| `actions/group.mutations.ts` | `createGroupAction`, `deleteGroupAction` |

## Invariants

- Soft delete obligatoire — `Schedule.group` Restrict bloque le hard delete si séances liées
- `deleteGroup` : vérification ownership avant soft delete (findFirst avec orgId)

## Points d'extension (⚠)

- `updateGroupAction` pour renommer
- `setGroupStudentsAction` — diff transactionnel add/remove StudentGroup

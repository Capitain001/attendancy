# Service : department

Gère les départements d'une organisation.
1 modèle Prisma : `Department`.

## Fichiers

| Fichier | Rôle |
|---------|------|
| `database/department.queries.ts` | Lectures avec `"use cache"` + `_count` pour filières/enseignants/UEs |
| `database/department.mutations.ts` | `createDepartment`, `updateDepartment`, `deleteDepartment` |
| `cache.ts` | `DEPARTMENT_GRAPH` — enregistré dans `src/cache/server/key.ts` |
| `validation.ts` | `createDepartmentSchema`, `updateDepartmentSchema` |
| `actions/department.mutations.ts` | `createDepartmentAction`, `updateDepartmentAction`, `deleteDepartmentAction` |
| `actions/department.queries.ts` | `getDepartmentsAction` |

## Invariants

- Pas de `deletedAt` — suppression = hard delete (`deleteDepartment`)
- Suppression bloquée par P2003 si programTracks / teachers / UEs attachés (mappé dans `CONSTRAINT_ERROR`)
- `@@unique([name, orgId])` → contrainte mappée dans `CONSTRAINT_ERROR`
- Seule la DIRECTION peut créer / modifier / supprimer

## Points d'extension (⚠)

- `getDepartmentAction(departmentId)` si vue détail nécessaire
- `DEPARTMENT_GRAPH` cross-service si une query d'un autre service inclut `department` dans son `select`

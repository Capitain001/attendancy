# Service : department

Gère les départements d'une organisation.
1 modèle Prisma : `Department`.

## Fichiers

| Fichier | Rôle |
|---------|------|
| `actions/department.mutations.ts` | `createDepartmentAction`, `updateDepartmentAction`, `deleteDepartmentAction` |
| `actions/department.queries.ts` | `getDepartmentsAction` |
| `actions/index.ts` | Barrel exports des actions |
| `cache.ts` | `DEPARTMENT_GRAPH` — enregistré dans `src/cache/server/key.ts` |
| `database/department.mutations.ts` | `createDepartment`, `updateDepartment`, `deleteDepartment` |
| `database/department.queries.ts` | Lectures avec `"use cache"` + `_count` pour filières/enseignants/UEs |
| `database/index.ts` | Barrel interne (non exporté) |
| `generated.types.ts` | Types générés automatiquement (DTOs de lecture) |
| `index.ts` | Point d'entrée du service (export actions + types) |
| `types.ts` | DTOs et types du domaine |
| `validation.ts` | `createDepartmentSchema`, `updateDepartmentSchema` |
## Invariants

- Pas de `deletedAt` — suppression = hard delete (`deleteDepartment`)
- Suppression bloquée par P2003 si programTracks / teachers / UEs attachés (mappé dans `CONSTRAINT_ERROR`)
- `@@unique([name, orgId])` → contrainte mappée dans `CONSTRAINT_ERROR`
- Seule la DIRECTION peut créer / modifier / supprimer

## Points d'extension (⚠)

- `getDepartmentAction(departmentId)` si vue détail nécessaire
- `DEPARTMENT_GRAPH` cross-service si une query d'un autre service inclut `department` dans son `select`

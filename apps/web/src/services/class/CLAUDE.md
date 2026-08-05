# Service : class

Gère les promotions réelles d'une année académique — `Class`.

## Particularité multi-tenant

`Class` n'a pas de champ `orgId` direct. Org scoping via `programTrack: { orgId }` dans les `where` Prisma.
- Queries: `where: { programTrack: { orgId } }`
- Mutations: `where: { programTrack: { orgId } }` pour update/delete
- Create: vérifier `programTrack.findFirst({ where: { id, orgId } })` avant création

## Fichiers

| Fichier | Rôle |
|---------|------|
| `database/class.queries.ts` | `getClasses`, `getClass` |
| `database/class.mutations.ts` | `createClass`, `removeClass` (soft delete) |
| `cache.ts` | `CLASS_GRAPH` — invalidation liste + détail |
| `validation.ts` | `createClassSchema` (Level enum : L1…D3) |
| `actions/class.queries.ts` | `getClassesAction(yearId?)`, `getClassAction(classId)` |
| `actions/class.mutations.ts` | `createClassAction`, `removeClassAction` |

## Invariants

- `@@unique([programTrackId, name, academicYearId])` → `Class_programTrackId_name_academicYearId_key`
- `deletedAt` = soft delete — `where: { deletedAt: null }` dans les queries
- `createClass` : si `academicYearId` absent → fallback `getCurrentYear(orgId)` (throws si aucune année courante)

## Points d'extension (⚠)

- `updateClassAction` pour renommer ou changer le programId
- `applyProgramAction` — instancie UECourse→Course + ProgramUE.semester→Term pour la classe
- CACHE.CLASS invalidé aussi lors de mutations sur Group, Course, StudentEnrollment

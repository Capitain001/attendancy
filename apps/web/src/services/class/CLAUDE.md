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
| `actions/class.mutations.ts` | `createClassAction`, `removeClassAction` |
| `actions/class.queries.ts` | `getClassesAction(yearId?)`, `getClassAction(classId)` |
| `actions/index.ts` | Barrel exports des actions |
| `cache.ts` | `CLASS_GRAPH` — invalidation liste + détail |
| `constants.ts` | Constantes du domaine |
| `database/class.mutations.ts` | `createClass`, `removeClass` (soft delete) |
| `database/class.queries.ts` | `getClasses`, `getClass` |
| `database/index.ts` | Barrel interne (non exporté) |
| `generated.types.ts` | Types générés automatiquement (DTOs de lecture) |
| `index.ts` | Point d'entrée du service (export actions + types) |
| `policy.ts` | Règles d'autorisation métier |
| `types.ts` | DTOs et types du domaine |
| `validation.ts` | `createClassSchema` (Level enum : L1…D3) |
## Invariants

- `@@unique([programTrackId, name, academicYearId])` → `Class_programTrackId_name_academicYearId_key`
- `deletedAt` = soft delete — `where: { deletedAt: null }` dans les queries
- `createClass` : si `academicYearId` absent → fallback `getCurrentYear(orgId)` (throws si aucune année courante)

## Points d'extension (⚠)

- `updateClassAction` pour renommer ou changer le programId
- `applyProgramAction` — instancie UECourse→Course + ProgramUE.semester→Term pour la classe
- CACHE.CLASS invalidé aussi lors de mutations sur Group, Course, StudentEnrollment

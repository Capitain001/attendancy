# Service : academic-year

Gère le cycle de vie des années académiques d'une organisation.
1 modèle Prisma : `AcademicYear`.

## Fichiers

| Fichier | Rôle |
|---------|------|
| `actions/academic-year.mutations.ts` | `createAcademicYearAction`, `setCurrentYearAction`, `removeAcademicYearAction` |
| `actions/academic-year.queries.ts` | `getAcademicYearsAction`, `getCurrentYearAction` |
| `actions/index.ts` | Barrel exports des actions |
| `cache.ts` | `ACADEMIC_YEAR_GRAPH` — enregistré dans `src/cache/server/key.ts` |
| `database/academic-year.mutations.ts` | `createAcademicYear`, `setCurrentYear`, `removeAcademicYear` |
| `database/academic-year.queries.ts` | Lectures avec `"use cache"` |
| `database/index.ts` | Barrel interne (non exporté) |
| `generated.types.ts` | Types générés automatiquement (DTOs de lecture) |
| `index.ts` | Point d'entrée du service (export actions + types) |
| `types.ts` | `GetAcademicYearsDto`, `GetCurrentYearDto`, `AcademicYearItem` |
| `validation.ts` | `createAcademicYearSchema`, `setCurrentYearSchema` |
## Invariants

- `isActive` = soft delete (pas de `deletedAt` sur ce modèle — `removeAcademicYear` pose `isActive: false, isCurrent: false`)
- `setCurrentYear` est atomique ($transaction) : unset all → set target
- Seule la DIRECTION peut créer / archiver / définir l'année courante
- `@@unique([name, orgId])` → contrainte mappée dans `CONSTRAINT_ERROR`

## Points d'extension (⚠)

- Ajouter `ACADEMIC_YEAR_GRAPH` dans le cross-service si une autre query inclut `academicYear` dans son `select`
- Ajouter `updateAcademicYearAction` si l'édition des dates est nécessaire

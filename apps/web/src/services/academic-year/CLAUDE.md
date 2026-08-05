# Service : academic-year

Gère le cycle de vie des années académiques d'une organisation.
1 modèle Prisma : `AcademicYear`.

## Fichiers

| Fichier | Rôle |
|---------|------|
| `database/academic-year.queries.ts` | Lectures avec `"use cache"` |
| `database/academic-year.mutations.ts` | `createAcademicYear`, `setCurrentYear`, `removeAcademicYear` |
| `cache.ts` | `ACADEMIC_YEAR_GRAPH` — enregistré dans `src/cache/server/key.ts` |
| `validation.ts` | `createAcademicYearSchema`, `setCurrentYearSchema` |
| `actions/academic-year.queries.ts` | `getAcademicYearsAction`, `getCurrentYearAction` |
| `actions/academic-year.mutations.ts` | `createAcademicYearAction`, `setCurrentYearAction`, `removeAcademicYearAction` |
| `types.ts` | `GetAcademicYearsDto`, `GetCurrentYearDto`, `AcademicYearItem` |

## Invariants

- `isActive` = soft delete (pas de `deletedAt` sur ce modèle — `removeAcademicYear` pose `isActive: false, isCurrent: false`)
- `setCurrentYear` est atomique ($transaction) : unset all → set target
- Seule la DIRECTION peut créer / archiver / définir l'année courante
- `@@unique([name, orgId])` → contrainte mappée dans `CONSTRAINT_ERROR`

## Points d'extension (⚠)

- Ajouter `ACADEMIC_YEAR_GRAPH` dans le cross-service si une autre query inclut `academicYear` dans son `select`
- Ajouter `updateAcademicYearAction` si l'édition des dates est nécessaire

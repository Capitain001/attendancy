# Service `teacher-course-hours`

## Rôle
<!-- TODO : une phrase — ce que ce service possède et gère. -->

## Modèle Prisma
`TeacherCourseHours` — `prisma.teacherCourseHours` uniquement dans ce service.
Régime de suppression : **hard delete** (`delete*`).

## Fichiers
- `database/teacher-course-hours.queries.ts` — lectures Prisma (`"use cache"`)
- `database/teacher-course-hours.mutations.ts` — écritures Prisma (`tryConstraint` + `invalidateEvent`)
- `cache.ts` — graphe d'invalidation (`TEACHER_COURSE_HOURS_GRAPH`)
- `validation.ts` — schémas Valibot
- `actions/teacher-course-hours.queries.ts` — queries exposées au frontend
- `actions/teacher-course-hours.mutations.ts` — mutations `"use server"`
- `constants.ts`, `types.ts` — enums + DTOs inférés

## Contraintes
<!-- TODO : invariants métier, index partiels, triggers DB liés (le cas échéant). -->

## Questions ouvertes
<!-- TODO -->

## Commandes

CMD des generateurs pour le service teacher-course-hours :
```bash
# index API
npx tsx scripts/generate/api/api.ts teacher-course-hours

# types
npx tsx scripts/generate/types/types.ts teacher-course-hours

# résumé
npx tsx scripts/generate/summary/summary.ts teacher-course-hours
```

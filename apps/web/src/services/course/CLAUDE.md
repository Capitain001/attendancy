# Service : course

Gère les cours d'une classe (`Course`). Les affectations enseignant
(`CourseTeacher`) vivent dans le service dédié [`course-teacher`](../course-teacher/CLAUDE.md).

## Particularités

- `Course` a `orgId` direct + `classId` — double scoping standard
- Unicité `(classId, ueCourseId)` gérée par INDEX PARTIAL `WHERE deletedAt IS NULL`
  → non exprimable en Prisma → check manuel avant `create` (findFirst + throw)
- `getCourseDetail` / `getCoursesByClass` lisent les enseignants en `select` imbriqué
  (agrégat d'affichage) → une mutation `course-teacher` invalide aussi les tags COURSE.

## Fichiers

| Fichier | Rôle |
|---------|------|
| `database/course.queries.ts` | `getCourses`, `getCoursesByClass(classId, orgId)`, `getCourse`, `getCourseDetail(courseId, orgId)` (fiche complète : class+level+count, ueCourse, teachers, schedules+attendances), `getCourseClassId` (lookup ownership exposé à `course-teacher`) |
| `database/course.mutations.ts` | `createCourse`, `updateCourse`, `removeCourse` |
| `cache.ts` | `COURSE_GRAPH` — invalide COURSE + CLASS (count affiché dans détail) |
| `validation.ts` | `createCourseSchema` |
| `actions/course.queries.ts` | `getAllCoursesAction`, `getCoursesAction(classId)`, `getCourseAction`, `getCourseDetailAction(courseId)` |
| `actions/course.mutations.ts` | `createCourseAction`, `updateCourseAction`, `removeCourseAction` |

## Consommateurs

- `getCourseDetailAction` → page `direction/courses/[courseId]` (composants `components/courses/direction/`).
  Les types UI y sont inférés depuis `GetCourseDetailDto` (jamais réécrits à la main).

## Invariants

- `createCourse` : findFirst ownership check sur Class + UECourse avant création
- Partial unique check manuel : `findFirst({ where: { classId, ueCourseId, deletedAt: null } })`
- `getCourseClassId(courseId, orgId)` : lookup léger `{ id, classId }` — exposé pour que
  `course-teacher` vérifie l'ownership sans faire de `prisma.course` chez lui.

## Points d'extension (⚠)

- `updateCourseProgressAction` — durationDone (suivi avancement)
- `getCoursesAction` sans filtre classe — catalogue org
- Évaluations : `getCourseDetail` n'inclut pas encore les summaries d'évaluation
  (service dédié à venir) — `EvaluationsSection` rend un état vide en attendant.

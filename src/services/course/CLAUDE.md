# Service : course

Gère les cours d'une classe (`Course`) et leurs affectations enseignant (`CourseTeacher`).

## Particularités

- `Course` a `orgId` direct + `classId` — double scoping standard
- Unicité `(classId, ueCourseId)` gérée par INDEX PARTIAL `WHERE deletedAt IS NULL`
  → non exprimable en Prisma → check manuel avant `create` (findFirst + throw)
- `CourseTeacher` = sous-entité de Course dans ce service (@@unique([teacherId, courseId]))

## Fichiers

| Fichier | Rôle |
|---------|------|
| `database/course.queries.ts` | `getCoursesByClass(classId, orgId)` avec teachers |
| `database/course.mutations.ts` | `createCourse`, `assignTeacher`, `removeTeacherFromCourse` |
| `cache.ts` | `COURSE_GRAPH` — invalide COURSE + CLASS (count affiché dans détail) |
| `validation.ts` | `createCourseSchema`, `assignTeacherSchema` |
| `actions/course.queries.ts` | `getCoursesAction(classId)` |
| `actions/course.mutations.ts` | `createCourseAction`, `assignTeacherAction`, `removeTeacherAction` |

## Invariants

- `createCourse` : findFirst ownership check sur Class + UECourse avant création
- Partial unique check manuel : `findFirst({ where: { classId, ueCourseId, deletedAt: null } })`
- `CourseTeacher_teacherId_courseId_key` → CONSTRAINT_ERROR à ajouter si besoin
- `removeTeacherFromCourse` : findFirst ownership avant delete (CourseTeacher sans orgId direct)

## Points d'extension (⚠)

- `removeCourseAction` — soft delete + invalider cache
- `updateCourseProgressAction` — durationDone (suivi avancement)
- `getCoursesAction` sans filtre classe — catalogue org

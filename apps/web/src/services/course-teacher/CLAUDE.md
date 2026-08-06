# Service `course-teacher`

## Rôle
Possède les affectations enseignant ↔ cours (`CourseTeacher`) : un enseignant
principal (`isMain`) + des assistants, avec volume horaire confié (`hours`).
Détaché du service `course` (règle « 1 modèle Prisma = 1 service »).

## Modèle Prisma
`CourseTeacher` — `prisma.courseTeacher` uniquement dans ce service.
Régime de suppression : **hard delete** (`delete*`, événement `*_DELETED`) —
pas de `deletedAt` sur le modèle.

## Fichiers
- `database/course-teacher.queries.ts` — `getCourseTeachers`, `getCourseTeachersIds` (`"use cache"`, tag `COURSE_TEACHER`)
- `database/course-teacher.mutations.ts` — `assignTeacher`, `deleteTeacherFromCourse`, `syncCourseTeachers`
- `cache.ts` — `COURSE_TEACHER_GRAPH` — invalide COURSE_TEACHER **+ COURSE** (cross-service, voir Contraintes)
- `validation.ts` — `assignTeacherSchema`, `syncCourseTeachersSchema`
- `actions/course-teacher.queries.ts` — `getCourseTeachersAction`, `getCourseTeachersIdAction`
- `actions/course-teacher.mutations.ts` — `assignTeacherAction`, `deleteTeacherAction`, `syncCourseTeachersAction`
- `types.ts` — `CourseTeacher` (alias `GetCourseTeachersDto[number]`) + DTOs générés

## Contraintes
- `@@unique([teacherId, courseId])` — un enseignant ne peut être affecté deux
  fois au même cours (via `assignTeacher` : `tryConstraint` remonte l'erreur).
- **Invalidation cross-service** : le détail cours (`getCourseDetail`, service
  `course`) embarque les enseignants dans son `select` → chaque mutation
  invalide AUSSI les tags `CACHE.COURSE` (voir `cache.ts`). Le `classId` requis
  pour ces tags vient de `getCourseClassId` (service `course`) — jamais d'un
  `prisma.course` local.
- `syncCourseTeachers` : remplacement intégral en transaction (deleteMany +
  recreate) — `principalId` vide = aucun principal.
- Ownership : `deleteTeacherFromCourse` scope via `course: { orgId }` (le modèle
  n'a pas d'`orgId` direct).

## Questions ouvertes
- `hours` non exposé par `syncCourseTeachers` (co-enseignement fin) — à ajouter si besoin.

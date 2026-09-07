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

| Fichier | Rôle |
|---------|------|
| `actions/course-teacher.mutations.ts` | Écritures serveur (Validation + AuthGuard) |
| `actions/course-teacher.queries.ts` | Lectures serveur exposées au frontend |
| `actions/index.ts` | Barrel exports des actions |
| `cache.ts` | <SERVICE>_GRAPH : événement → tags à invalider |
| `constants.ts` | Constantes du domaine |
| `database/course-teacher.mutations.ts` | Requêtes Prisma (tryConstraint + invalidateEvent) |
| `database/course-teacher.queries.ts` | Requêtes Prisma (lectures avec cache) |
| `database/index.ts` | Barrel interne (non exporté) |
| `generated.types.ts` | Types générés automatiquement (DTOs de lecture) |
| `index.ts` | Point d'entrée du service (export actions + types) |
| `types.ts` | DTOs et types du domaine |
| `validation.ts` | Schémas Valibot |
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

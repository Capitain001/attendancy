# Service : student

Gère les profils étudiants (`Student`), inscriptions en classe (`StudentEnrollment`)
et affectations aux groupes (`StudentGroup`).

## Particularités multi-tenant

- `Student` a `orgId` direct — scoping standard
- `StudentEnrollment` n'a pas `orgId` — scoping via `class.programTrack.orgId`
- `StudentGroup` n'a pas `orgId` — scoping via `enrollment.class.programTrack.orgId`

## Fichiers

| Fichier | Rôle |
|---------|------|
| `actions/index.ts` | Barrel exports des actions |
| `actions/student.analytics.ts` | Fonctions liées aux statistiques |
| `actions/student.mutations.ts` | 4 actions DIRECTION |
| `actions/student.queries.ts` | `getEnrolledStudentsAction(classId)` |
| `cache.ts` | `STUDENT_GRAPH` — invalide STUDENT + CLASS (counts) |
| `database/index.ts` | Barrel interne (non exporté) |
| `database/student.analytics.ts` | Fonctions liées aux statistiques |
| `database/student.mutations.ts` | `enrollStudent`, `removeEnrollment`, `assignStudentGroup`, `deleteStudentGroup` |
| `database/student.queries.ts` | Profil, planning, statistiques et détails des séances étudiant |
| `generated.types.ts` | Types générés automatiquement (DTOs de lecture) |
| `index.ts` | Point d'entrée du service (export actions + types) |
| `types.ts` | DTOs et types du domaine |
| `validation.ts` | `enrollStudentSchema`, `assignStudentGroupSchema` |
## Invariants

- Les statistiques de présence réutilisent les règles du service attendance via son point d'entrée serveur.
- Le périmètre des taux étudiant est limité à la classe active, aux groupes de l'étudiant et aux séances clôturées.

- `@@unique([studentId, classId])` → `StudentEnrollment_studentId_classId_key`
- `@@unique([enrollmentId, groupId])` → `StudentGroup_enrollmentId_groupId_key`
- `removeEnrollment` → soft delete (`endedAt: new Date()`) pour préserver historique présences
- `deleteStudentGroup` → hard delete (pas d'historique lié à la relation directe)
- Trigger `validate_student_class_group` garantit cohérence enrollment↔group côté DB

## Points d'extension (⚠)

- Import en masse d'étudiants (CSV)
- `getStudentProfileAction(studentId)` — vue étudiant individuel
- `OptionalUE` — choix UE optionnelle par étudiant + année

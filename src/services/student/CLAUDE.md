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
| `database/student.queries.ts` | `getEnrolledStudents(classId, orgId)` — liste avec groupes |
| `database/student.mutations.ts` | `enrollStudent`, `removeEnrollment`, `assignStudentGroup`, `deleteStudentGroup` |
| `cache.ts` | `STUDENT_GRAPH` — invalide STUDENT + CLASS (counts) |
| `validation.ts` | `enrollStudentSchema`, `assignStudentGroupSchema` |
| `actions/student.queries.ts` | `getEnrolledStudentsAction(classId)` |
| `actions/student.mutations.ts` | 4 actions DIRECTION |

## Invariants

- `@@unique([studentId, classId])` → `StudentEnrollment_studentId_classId_key`
- `@@unique([enrollmentId, groupId])` → `StudentGroup_enrollmentId_groupId_key`
- `removeEnrollment` → soft delete (`endedAt: new Date()`) pour préserver historique présences
- `deleteStudentGroup` → hard delete (pas d'historique lié à la relation directe)
- Trigger `validate_student_class_group` garantit cohérence enrollment↔group côté DB

## Points d'extension (⚠)

- Import en masse d'étudiants (CSV)
- `getStudentProfileAction(studentId)` — vue étudiant individuel
- `OptionalUE` — choix UE optionnelle par étudiant + année

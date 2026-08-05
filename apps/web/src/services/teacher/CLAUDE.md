# Service : teacher

Gère les profils enseignants dans l'organisation — `Teacher`.

## Particularité

Teacher n'a PAS de mutation "create" dans ce service — les profils sont créés via
le flux invite/onboarding (`invite/` service). Ce service gère l'édition du profil
(département) et les lectures.

## Fichiers

| Fichier | Rôle |
|---------|------|
| `database/teacher.queries.ts` | `getTeachers(orgId, deptId?)`, `getTeacher(teacherId, orgId)`, `getTeacherStats(teacherId, orgId)`, `getTeacherOrganizationStats(orgId)` |
| `database/teacher.mutations.ts` | `updateTeacherDepartment` |
| `cache.ts` | `TEACHER_GRAPH` — invalide liste + détail |
| `validation.ts` | `updateTeacherDepartmentSchema` |
| `actions/teacher.queries.ts` | `getTeachersAction(deptId?)`, `getTeacherAction(teacherId)`, `getTeacherStatsAction(teacherId)`, `getTeacherOrganizationStatsAction()` |
| `actions/teacher.mutations.ts` | `updateTeacherDepartmentAction` (DIRECTION) |

## Invariants

- `@@unique([userId, orgId])` — un userId ne peut être Teacher qu'une fois par org
- `departmentId` nullable — un enseignant peut ne pas avoir de département assigné
- Lectures : tous membres (no getAuthorization dans query actions)
- Mutations : DIRECTION uniquement
- `ponctualite` calculé depuis `Session.isLate` (trigger DB `teacher_check_in`) — pas de recalcul manuel
- `Session` n'a pas de `deletedAt` — pas de filtre sur ce champ dans les queries session

## Points d'extension (⚠)

- `deactivateTeacherAction` : `deletedAt: new Date()` + invalider cache
- `getTeacherCoursesAction(teacherId)` — charges et cours assignés

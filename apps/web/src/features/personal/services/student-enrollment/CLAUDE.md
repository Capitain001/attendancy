# features/personal/services/student-enrollment

## Rôle
Gestion de l'inscription des étudiants aux cours dans l'espace personnel enseignant (`PERSONAL`).
Dans une classe thématique, inscrire un étudiant à un cours revient à rattacher son inscription de classe (`StudentEnrollment`) au groupe dédié du cours (`StudentGroup`).

## Fichiers
| Fichier | Rôle |
|---|---|
| `database/student-enrollment.mutations.ts` | `enrollStudentsInPersonalCourse` (garde org + tx atomique Group + StudentGroup) |
| `database/index.ts` | Re-export des mutations internes |
| `validation.ts` | `enrollStudentsInPersonalCourseSchema` (Valibot) |
| `actions/student-enrollment.mutations.ts` | `enrollStudentsInPersonalCourseAction` ("use server") |
| `types.ts` | DTOs et types du domaine |
| `index.ts` | Point d'entrée public de la feature service |

## Invariants
- `classId` déduit du cours en DB, jamais accepté depuis le client.
- Si le groupe lié au cours n'existe pas, création atomique dans la même transaction.
- Inscriptions actives uniquement (`endedAt: null`).
- Idempotent grâce à l'index unique `[enrollmentId, groupId]` (`skipDuplicates: true`).
- Retourne `{ notAddedStudentIds }` pour les étudiants non inscrits dans la classe parente.
- Pas de `cache.ts` propre : réutilise les événements `GROUP_CREATED`, `GROUP_UPDATED`, `COURSE_UPDATED`.

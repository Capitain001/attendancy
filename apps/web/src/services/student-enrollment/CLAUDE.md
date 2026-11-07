# Service `student-enrollment`

## Rôle
Domaine propriétaire du modèle `StudentEnrollment`.
Gère les inscriptions des étudiants aux classes (relation entre `Student` et `Class`).

## Fichiers

| Fichier | Rôle |
|---------|------|
| `actions/index.ts` | Barrel exports des actions |
| `actions/student-enrollment.mutations.ts` | Écritures serveur (Validation + AuthGuard) |
| `actions/student-enrollment.queries.ts` | Lectures serveur exposées au frontend |
| `cache.ts` | <SERVICE>_GRAPH : événement → tags à invalider |
| `constants.ts` | Constantes du domaine |
| `database/index.ts` | Barrel interne (non exporté) |
| `database/student-enrollment.mutations.ts` | Requêtes Prisma (tryConstraint + invalidateEvent) |
| `server.ts` | Primitive d'inscription idempotente réutilisable depuis d'autres modules serveur |
| `database/student-enrollment.queries.ts` | Requêtes Prisma (lectures avec cache) |
| `generated.types.ts` | Types générés automatiquement (DTOs de lecture) |
| `index.ts` | Point d'entrée du service (export actions + types) |
| `types.ts` | DTOs et types du domaine |
| `validation.ts` | Schémas Valibot |

## Primitive serveur réutilisable
- `createStudentEnrollmentRaw(tx, data)` utilise l'upsert sur `(studentId, classId)` : crée l'inscription ou rouvre la même ligne avec `endedAt: null`.
- Elle ne vérifie pas l'appartenance à l'organisation et n'invalide pas le cache. Tout appelant doit vérifier que l'étudiant et la classe appartiennent à l'organisation active; les opérations publiques du service ajoutent leurs garde-fous et invalidations.
- Les modules serveur externes l'importent uniquement via `server.ts`; ne pas exposer cette primitive au frontend.

## Invariants
- `orgId` n'est pas stocké directement sur `StudentEnrollment` mais hérité de `Class` / `Student`. Les requêtes vérifient `class.orgId`.
- **Soft delete alternatif** : L'inscription est "désactivée" via `endedAt = new Date()` (au lieu du classique `deletedAt`). C'est géré par `removeStudentEnrollment`.
- Le retrait est autorisé à `DIRECTION` et à `TEACHER` dans une organisation `PERSONAL` (`allowPersonalOrg`).

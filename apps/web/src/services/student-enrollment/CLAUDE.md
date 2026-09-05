# Service `student-enrollment`

## Rôle
Domaine propriétaire du modèle `StudentEnrollment`.
Gère les inscriptions des étudiants aux classes (relation entre `Student` et `Class`).

## Fichiers
- `database/` : interactions Prisma exclusives au modèle `StudentEnrollment`.
- `actions/` : server actions pour créer, modifier (terminer un enrôlement) et lire les inscriptions.
- `validation.ts` : Schémas Valibot stricts pour l'inscription d'un étudiant.
- `types.ts` : DTOs générés par le script.

## Invariants
- `orgId` n'est pas stocké directement sur `StudentEnrollment` mais hérité de `Class` / `Student`. Les requêtes vérifient `class.orgId`.
- **Soft delete alternatif** : L'inscription est "désactivée" via `endedAt = new Date()` (au lieu du classique `deletedAt`). C'est géré par `removeStudentEnrollment`.

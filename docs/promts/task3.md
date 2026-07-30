# Audit des `onDelete` sur l'ensemble du schéma Prisma + objets SQL post-migrate

## Contexte

Le schéma est modularisé dans `prisma/schemas/` (schema.prisma + tenant/profile/academic/schedule/attendance/evaluation/communication/billing.prisma). Certains index, contraintes, exclusions et triggers ne vivent PAS dans Prisma mais dans `prisma/post-migrate/*.sql` (voir structure jointe : `00_extensions.sql` → `80_billing.sql`, un fichier par domaine, ordre = dépendances). `prisma/verify/verify.sql` liste ce qui doit exister mais ne le crée pas.

Un audit partiel sur `tenant.prisma` (User, Organization, UserOrganization, Permission, Invitation, Document, AuditLog, ApprovalRequest) a révélé une incohérence : certaines FK vers `User` qui sont **nullables et purement attributives** (qui a fait/uploadé/validé quelque chose) sont restées en `Restrict` par défaut, alors qu'on a décidé pour `AuditLog.userId` de passer en `SetNull` (la trace doit survivre à la suppression de l'acteur, seule l'identité est dissociée). Exemples déjà repérés : `Document.uploadedById`, `Permission.assignedById`, `Invitation.userId`, `ApprovalRequest.reviewedById`.

Il y a aussi une question ouverte sur `Organization` : le commentaire dans le schéma dit *"la purge RGPD d'une org part d'ici"*, mais quasiment aucune relation vers `Organization` n'a de `onDelete` explicite (défaut = Restrict/NoAction), à l'exception de `OrganizationSettings`/`OrganizationUsage` en `Cascade`. Il faut savoir si la purge est orchestrée applicativement (Restrict = garde-fou voulu) ou si du Cascade manque.

## Ce que je veux

1. **Lis tous les fichiers de `prisma/schemas/`** (pas juste `tenant.prisma`) et **tous les fichiers de `prisma/post-migrate/`**, y compris `verify/verify.sql`.

2. **Construis un inventaire complet** de chaque relation FK dans le schéma Prisma :
   - modèle source → modèle cible, nom du champ
   - le champ FK est-il nullable ou requis
   - `onDelete` actuel (explicite ou défaut implicite)
   - si le modèle source a un `deletedAt` (soft delete) — ça change la fréquence réelle du hard delete
   - si le champ FK sert d'attribution (qui a fait X) vs de composition structurelle (la ligne n'a pas de sens sans son parent)

3. **Croise avec le SQL des `post-migrate/*.sql`** : repère les FK, contraintes `CHECK`/`EXCLUDE`, triggers qui référencent ces mêmes relations ou qui dépendent d'un comportement de suppression particulier (ex. un trigger qui suppose qu'une ligne ne sera jamais NULL après suppression du parent). Signale tout endroit où le SQL manuel et le `onDelete` Prisma pourraient se contredire.

4. **Produis une table de décision** (un tableau, pas de prose) : `Modèle.champ | cible | nullable? | onDelete actuel | recommandation | justification en une ligne`. Applique cette grille de lecture, cohérente avec ce qu'on a déjà tranché sur `AuditLog` :
   - **Cascade** : la ligne enfant n'a aucun sens sans son parent (tables de liaison pures, config 1-1 type Settings/Usage).
   - **SetNull** : champ nullable, purement attributif/historique — la ligne doit survivre, seule la référence à l'acteur/ressource disparaît.
   - **Restrict** (défaut) : à garder seulement si c'est un choix assumé (protection d'un historique métier, cf. convention déjà actée `ProgramUE.ue`/`UECourse.ue`), pas un oubli.
   - Flag explicite si un champ FK requis (non-nullable) est pourtant purement attributif → ça veut dire qu'il faudrait le rendre nullable pour permettre SetNull, à discuter au cas par cas.

5. **Section à part sur `Organization`** : liste toutes les relations qui pointent vers `Organization` dans tous les fichiers (pas juste tenant.prisma), avec leur `onDelete` actuel, et propose une position claire : purge orchestrée applicativement (et donc documenter ce choix dans le schéma) OU liste précise des `Cascade` manquants si l'intention est une suppression DB directe.

6. **Ne propose aucune migration ni modification de fichier pour l'instant** — je veux d'abord la table de décision et les questions ouvertes, pour trancher avant d'écrire quoi que ce soit.
# Service `user-organization`

## Rôle
Gère les adhésions entre utilisateurs et organisations : rôle, statut d'accès et réintégration.

## Modèle Prisma
`UserOrganization` — `prisma.userOrganization` uniquement dans ce service.
Régime de suppression : **hard delete** (`delete*`).

## Fichiers

| Fichier | Rôle |
|---------|------|
| `actions/index.ts` | Barrel exports des actions |
| `actions/user-organization.mutations.ts` | Écritures serveur (Validation + AuthGuard) |
| `actions/user-organization.queries.ts` | Lectures serveur exposées au frontend |
| `cache.ts` | <SERVICE>_GRAPH : événement → tags à invalider |
| `constants.ts` | Constantes du domaine |
| `database/index.ts` | Barrel interne (non exporté) |
| `database/user-organization.mutations.ts` | Requêtes Prisma (tryConstraint + invalidateEvent) |
| `database/user-organization.queries.ts` | Requêtes Prisma (lectures avec cache) |
| `server.ts` | Point d'entrée serveur des primitives transactionnelles exposées aux autres modules |
| `generated.types.ts` | Types générés automatiquement (DTOs de lecture) |
| `index.ts` | Point d'entrée du service (export actions + types) |
| `policy.ts` | Règles d'autorisation métier |
| `types.ts` | DTOs et types du domaine |
| `validation.ts` | Schémas Valibot |
## Contraintes
- `ensureUserOrganization(client, { userId, orgId, role })` garantit l'unicité de l'adhésion par upsert et est sûre à rejouer.
- Si l'adhésion existe, la primitive ne modifie ni le rôle ni le statut. Une adhésion `INACTIVE` se réintègre explicitement avec `reintegrateUserOrganization`.
- `ensureUserOrganization` ne détermine pas `isMainOrg` ou `isResponsable`; ces champs relèvent des autres flux et conservent leurs valeurs/defaults DB.
- Les consommateurs transactionnels externes importent uniquement `ensureUserOrganization` depuis `server.ts`; pas d'import direct de `database/` et pas d'exposition au frontend.

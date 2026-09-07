# Service `user-organization`

## Rôle
<!-- TODO : une phrase — ce que ce service possède et gère. -->

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
| `generated.types.ts` | Types générés automatiquement (DTOs de lecture) |
| `index.ts` | Point d'entrée du service (export actions + types) |
| `policy.ts` | Règles d'autorisation métier |
| `types.ts` | DTOs et types du domaine |
| `validation.ts` | Schémas Valibot |
## Contraintes
<!-- TODO : invariants métier, index partiels, triggers DB liés (le cas échéant). -->

## Questions ouvertes
<!-- TODO -->

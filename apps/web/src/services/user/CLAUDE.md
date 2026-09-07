# Service `user`

## Rôle
<!-- TODO : une phrase — ce que ce service possède et gère. -->

## Modèle Prisma
`User` — `prisma.user` uniquement dans ce service.
Régime de suppression : **hard delete** (`delete*`).

## Fichiers

| Fichier | Rôle |
|---------|------|
| `actions/index.ts` | Barrel exports des actions |
| `actions/user.mutations.ts` | Écritures serveur (Validation + AuthGuard) |
| `actions/user.queries.ts` | Lectures serveur exposées au frontend |
| `cache.ts` | <SERVICE>_GRAPH : événement → tags à invalider |
| `constants.ts` | Constantes du domaine |
| `database/index.ts` | Barrel interne (non exporté) |
| `database/user.mutations.ts` | Requêtes Prisma (tryConstraint + invalidateEvent) |
| `database/user.queries.ts` | Requêtes Prisma (lectures avec cache) |
| `generated.types.ts` | Types générés automatiquement (DTOs de lecture) |
| `index.ts` | Point d'entrée du service (export actions + types) |
| `types.ts` | DTOs et types du domaine |
| `utils.ts` | Utilitaires internes |
| `validation.ts` | Schémas Valibot |
- `database/user.queries.ts` — lectures Prisma (`"use cache"`)
- `database/user.mutations.ts` — écritures Prisma (`tryConstraint` + `invalidateEvent`)
- `cache.ts` — graphe d'invalidation (`USER_GRAPH`)
- `validation.ts` — schémas Valibot
- `actions/user.queries.ts` — queries exposées au frontend
- `actions/user.mutations.ts` — mutations `"use server"`
- `constants.ts`, `types.ts` — enums + DTOs inférés

## Contraintes
<!-- TODO : invariants métier, index partiels, triggers DB liés (le cas échéant). -->

## Questions ouvertes
<!-- TODO -->

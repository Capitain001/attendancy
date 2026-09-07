# Service `curriculum`

## Rôle
<!-- TODO : une phrase — ce que ce service possède et gère. -->

## Modèle Prisma
`Curriculum` — `prisma.curriculum` uniquement dans ce service.
Régime de suppression : **hard delete** (`delete*`).

## Fichiers

| Fichier | Rôle |
|---------|------|
| `actions/curriculum.mutations.ts` | Écritures serveur (Validation + AuthGuard) |
| `actions/curriculum.queries.ts` | Lectures serveur exposées au frontend |
| `actions/index.ts` | Barrel exports des actions |
| `cache.ts` | <SERVICE>_GRAPH : événement → tags à invalider |
| `constants.ts` | Constantes du domaine |
| `database/curriculum.mutations.ts` | Requêtes Prisma (tryConstraint + invalidateEvent) |
| `database/curriculum.queries.ts` | Requêtes Prisma (lectures avec cache) |
| `database/index.ts` | Barrel interne (non exporté) |
| `generated.types.ts` | Types générés automatiquement (DTOs de lecture) |
| `index.ts` | Point d'entrée du service (export actions + types) |
| `types.ts` | DTOs et types du domaine |
| `validation.ts` | Schémas Valibot |
- `database/curriculum.queries.ts` — lectures Prisma (`"use cache"`)
- `database/curriculum.mutations.ts` — écritures Prisma (`tryConstraint` + `invalidateEvent`)
- `cache.ts` — graphe d'invalidation (`CURRICULUM_GRAPH`)
- `validation.ts` — schémas Valibot
- `actions/curriculum.queries.ts` — queries exposées au frontend
- `actions/curriculum.mutations.ts` — mutations `"use server"`
- `constants.ts`, `types.ts` — enums + DTOs inférés

## Contraintes
<!-- TODO : invariants métier, index partiels, triggers DB liés (le cas échéant). -->

## Questions ouvertes
<!-- TODO -->

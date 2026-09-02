# Service `curriculum`

## Rôle
<!-- TODO : une phrase — ce que ce service possède et gère. -->

## Modèle Prisma
`Curriculum` — `prisma.curriculum` uniquement dans ce service.
Régime de suppression : **hard delete** (`delete*`).

## Fichiers
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

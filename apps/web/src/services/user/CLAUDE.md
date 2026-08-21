# Service `user`

## Rôle
<!-- TODO : une phrase — ce que ce service possède et gère. -->

## Modèle Prisma
`User` — `prisma.user` uniquement dans ce service.
Régime de suppression : **hard delete** (`delete*`).

## Fichiers
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

# Service `parent-relation`

## Rôle

Possède la primitive idempotente de création du lien `ParentRelation`, utilisable
depuis des transactions métier externes.

## Modèle Prisma

`ParentRelation` — la clé unique est `(parentId, studentId)`.

## Fichiers

- `database/parent-relation.mutations.ts` — upsert transactionnel idempotent.
- `server.ts` — export serveur restreint de `ensureParentRelation`.

## Invariants

- Les consommateurs passent leur transaction Prisma à `ensureParentRelation`.
- Une relation existante n'est pas modifiée (upsert `update: {}`).
- Le détail `relation` et `orgId` n'est écrit qu'à la création.
- Ne pas importer `database/` depuis les consommateurs : utiliser `server.ts`.

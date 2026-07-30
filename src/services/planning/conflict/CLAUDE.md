# planning/conflict — contexte service

Détection et simulation de conflits d'occupation des ressources (salle, enseignant, classe, groupe).

## Architecture

```
conflict/
├── validation.ts          # Schémas Valibot partagés (uidSchema, coercedDate, checkConflictsParamsSchema)
├── actions.ts             # Server actions (checkAvailabilityAction, checkConflictsAction, filterAvailabilityAction)
├── index.ts               # Barrel
└── check/
    ├── availability.ts    # Pure logic — injectable PrismaClient (testable sans Next.js)
    ├── conflicts.ts       # SAVEPOINT simulation — détecte les conflits sans écrire en DB
    └── index.ts           # Barrel check/
```

## Invariants

- `during` est une colonne `tstzrange` Postgres — utiliser `tstzrange(...)` jamais `tsrange(...)`.
- `checkConflicts` utilise un `$transaction` + `SAVEPOINT`/`ROLLBACK TO SAVEPOINT` : aucune ligne n'est committée — la transaction est toujours rollbackée via `throw new Error('SIMULATION_ROLLBACK')`.
- `checkAvailability` prend un `prismaClient` injecté (testable). `checkAvailabilityAction` injecte `prisma` de `@/lib/db`.
- `DB_CONSTRAINTS` défini localement dans `conflicts.ts` — noms des contraintes GiST du schéma (définis dans `prisma/post-migrate/`).
- Validation auth-guard-first : `getUserInfo()` + `orgId` extraits AVANT le `try`.
- `uidSchema` de `./validation` — jamais Zod.

## Actions exposées

| Action                    | Description |
|---------------------------|-------------|
| `checkAvailabilityAction` | Disponibilité salles/profs/classes/groupes pour un créneau |
| `checkConflictsAction`    | Simulation conflit pour N occurrences (create/update schedule) |
| `filterAvailabilityAction`| Filtrage rapide salles/profs pour un créneau (subset de checkAvailability) |

## Conflits détectés

| Raison           | Contrainte DB              |
|------------------|----------------------------|
| `ROOM_OVERLAP`   | `no_room_overlap`          |
| `TEACHER_OVERLAP`| `no_teacher_overlap`       |
| `CLASS_OVERLAP`  | `no_class_overlap_global`  |
| `GROUP_OVERLAP`  | `no_group_overlap`         |

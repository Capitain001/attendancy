# Service `direction`

## Rôle

Gestion des membres de la direction d'un établissement (lecture + mutations de fonctions).
Les membres direction sont créés via `services/invite/direction/` — ce service gère leur
cycle de vie post-inscription (fonctions, soft delete).

## Fichiers

| Fichier | Rôle |
|---|---|
| `database/direction.queries.ts` | `getDirectionMembers`, `getDirectionMember`, `getDirectionMemberByUserId` |
| `database/direction.mutations.ts` | `assignFunctionsToMember`, `revokeFunctionsFromMember`, `updateMemberFunctions`, `removeDirectionMember` |
| `database/index.ts` | Barrel |
| `cache.ts` | `DIRECTION_GRAPH` — invalide `CACHE.DIRECTION(orgId)` |
| `actions/direction.queries.ts` | `getDirectionMembersAction`, `getDirectionMemberAction`, `getDirectionMemberByUserIdAction` |
| `actions/direction.mutations.ts` | `assignFunctionsToMemberAction`, `revokeFunctionsFromMemberAction`, `updateMemberFunctionsAction`, `deleteDirectionMemberAction` |
| `actions/index.ts` | Barrel actions |
| `types.ts` | DTOs dérivés via `Awaited<ReturnType<>>` |
| `validation.ts` | Schémas Valibot |
| `index.ts` | Barrel |

## Invariants

- `orgId` du token — jamais de l'input.
- `Direction.orgId` — V2 : champ direct (pas via `userOrganizations`).
- Soft delete : `Direction.deletedAt` — action `deleteDirectionMemberAction` (= remove).
- Fonctions filtrées par `function.orgId` pour isoler l'org courante.
- Création de membre direction → via `services/invite/direction/` uniquement.

## Fichiers

| Fichier | Rôle |
|---------|------|
| `actions/direction.mutations.ts` | Écritures serveur (Validation + AuthGuard) |
| `actions/direction.queries.ts` | Lectures serveur exposées au frontend |
| `actions/index.ts` | Barrel exports des actions |
| `cache.ts` | <SERVICE>_GRAPH : événement → tags à invalider |
| `database/direction.mutations.ts` | Requêtes Prisma (tryConstraint + invalidateEvent) |
| `database/direction.queries.ts` | Requêtes Prisma (lectures avec cache) |
| `database/index.ts` | Barrel interne (non exporté) |
| `generated.types.ts` | Types générés automatiquement (DTOs de lecture) |
| `index.ts` | Point d'entrée du service (export actions + types) |
| `types.ts` | DTOs et types du domaine |
| `validation.ts` | Schémas Valibot |

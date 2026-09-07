# Service program-ue

Rôle : Gestion du domaine `program-ue`.

## Fichiers
- `index.ts` : Barrel export (actions + types)
- `actions/` : Actions serveur ("use server")
- `database/` : Accès Prisma (interne au service)
- `types.ts` : DTOs du service
- `validation.ts` : Schémas Valibot

## Invariants
- `orgId` extrait du token serveur uniquement
- Multi-tenant strict : requêtes Prisma scopées par `orgId`
- Prisma et `database/` internes au service

## Fichiers

| Fichier | Rôle |
|---------|------|
| `actions/index.ts` | Barrel exports des actions |
| `actions/program-ue.mutations.ts` | Écritures serveur (Validation + AuthGuard) |
| `database/index.ts` | Barrel interne (non exporté) |
| `database/program-ue.mutations.ts` | Requêtes Prisma (tryConstraint + invalidateEvent) |
| `database/program-ue.queries.ts` | Requêtes Prisma (lectures avec cache) |
| `generated.types.ts` | Types générés automatiquement (DTOs de lecture) |
| `index.ts` | Point d'entrée du service (export actions + types) |
| `types.ts` | DTOs et types du domaine |
| `validation.ts` | Schémas Valibot |

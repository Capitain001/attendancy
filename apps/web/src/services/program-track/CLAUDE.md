# Service program-track

Rôle : Gestion du domaine `program-track`.

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
| `actions/programTrack.mutations.ts` | Écritures serveur (Validation + AuthGuard) |
| `actions/programTrack.queries.ts` | Lectures serveur exposées au frontend |
| `cache.ts` | <SERVICE>_GRAPH : événement → tags à invalider |
| `database/index.ts` | Barrel interne (non exporté) |
| `database/programTrack.mutations.ts` | Requêtes Prisma (tryConstraint + invalidateEvent) |
| `database/programTrack.queries.ts` | Requêtes Prisma (lectures avec cache) |
| `generated.types.ts` | Types générés automatiquement (DTOs de lecture) |
| `index.ts` | Point d'entrée du service (export actions + types) |
| `types.ts` | DTOs et types du domaine |
| `utils.ts` | Utilitaires internes |
| `validation.ts` | Schémas Valibot |

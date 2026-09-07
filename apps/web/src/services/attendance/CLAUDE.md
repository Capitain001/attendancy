# Service attendance

Rôle : Gestion du domaine `attendance`.

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
| `actions/analytics.ts` | Fichier interne |
| `actions/attendance.mutations.ts` | Écritures serveur (Validation + AuthGuard) |
| `actions/attendance.queries.ts` | Lectures serveur exposées au frontend |
| `actions/index.ts` | Barrel exports des actions |
| `cache.ts` | <SERVICE>_GRAPH : événement → tags à invalider |
| `database/analytics.ts` | Fichier interne |
| `database/attendance.mutations.ts` | Requêtes Prisma (tryConstraint + invalidateEvent) |
| `database/attendance.queries.ts` | Requêtes Prisma (lectures avec cache) |
| `database/filter.ts` | Fichier interne |
| `database/index.ts` | Barrel interne (non exporté) |
| `generated.types.ts` | Types générés automatiquement (DTOs de lecture) |
| `index.ts` | Point d'entrée du service (export actions + types) |
| `policy.ts` | Règles d'autorisation métier |
| `types.ts` | DTOs et types du domaine |
| `utils.ts` | Utilitaires internes |
| `validation.ts` | Schémas Valibot |

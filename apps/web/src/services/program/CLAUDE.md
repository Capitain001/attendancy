# Service program

Rôle : Gestion du domaine `program`.

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

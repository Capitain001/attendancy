# Service : ue

Catalogue des Unités d'Enseignement d'une organisation.
1 modèle Prisma : `UE`.

## Fichiers

| Fichier | Rôle |
|---------|------|
| `database/ue.queries.ts` | `getUEs(orgId, departmentId?)` avec `"use cache"` |
| `database/ue.mutations.ts` | `createUE`, `removeUE` (soft delete) |
| `cache.ts` | `UE_GRAPH` enregistré dans `src/cache/server/key.ts` |
| `validation.ts` | `createUESchema` |
| `actions/ue.queries.ts` | `getUEsAction(departmentId?)` |
| `actions/ue.mutations.ts` | `createUEAction`, `archiveUEAction` |

## Invariants

- `deletedAt` = archivage (soft delete) — convention du projet : UE archivée reste dans l'historique
- `removeUE` (DB) = soft delete → `archiveUEAction` (action) expose le terme domaine
- @@unique([code, orgId]) + @@unique([name, departmentId]) mappés dans CONSTRAINT_ERROR
- `departmentId` nullable — UE sans département autorisée
- Pas de getAuthorization sur `getUEsAction` — lecture accessible à tout membre org authentifié

## Points d'extension (⚠)

- `getUEAction(ueId)` si vue détail nécessaire (ajouter tag `CACHE.UE(orgId, ueId)`)
- `UE_ARCHIVED` invalide déjà `CACHE.UE(orgId, ueId)` en anticipation
- Guard applicatif "UE archivée non assignable à programme" → dans `addUEToProgramAction` (service program-track)

# Service : ue

Catalogue des Unités d'Enseignement d'une organisation.
1 modèle Prisma : `UE`.

## Fichiers

| Fichier | Rôle |
|---------|------|
| `actions/index.ts` | Barrel exports des actions |
| `actions/ue.mutations.ts` | `createUEAction`, `archiveUEAction` |
| `actions/ue.queries.ts` | `getUEsAction(departmentId?)` |
| `cache.ts` | `UE_GRAPH` enregistré dans `src/cache/server/key.ts` |
| `database/index.ts` | Barrel interne (non exporté) |
| `database/ue.mutations.ts` | `createUE`, `removeUE` (soft delete) |
| `database/ue.queries.ts` | `getUEs(orgId, departmentId?)` avec `"use cache"` |
| `generated.types.ts` | Types générés automatiquement (DTOs de lecture) |
| `index.ts` | Point d'entrée du service (export actions + types) |
| `types.ts` | DTOs et types du domaine |
| `utils.ts` | Utilitaires internes |
| `validation.ts` | `createUESchema` |
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

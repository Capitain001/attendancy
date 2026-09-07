# Service `term`

## Rôle

Gestion des semestres/termes d'une classe. Les terms sont des sous-entités
de `Class` — générés automatiquement depuis le programme attaché à la classe.

## Fichiers

| Fichier | Rôle |
|---------|------|
| `actions/index.ts` | Barrel exports des actions |
| `actions/term.mutations.ts` | `generateTermsFromProgramAction` — DIRECTION uniquement |
| `actions/term.queries.ts` | Lectures serveur exposées au frontend |
| `cache.ts` | `TERM_GRAPH` → invalide `CACHE.CLASS(orgId)` + `CACHE.CLASS(orgId, classId)` |
| `database/index.ts` | Barrel interne (non exporté) |
| `database/term.mutations.ts` | `generateTermsFromProgram` — transaction batch creation |
| `database/term.queries.ts` | Requêtes Prisma (lectures avec cache) |
| `generated.types.ts` | Types générés automatiquement (DTOs de lecture) |
| `index.ts` | Point d'entrée du service (export actions + types) |
| `types.ts` | DTOs |
| `validation.ts` | Schémas Valibot |
## Invariants

- Term = semestre numéroté (`order` = numéro de semestre du programUE).
- Idempotent : ne crée que les semestres manquants (filtre sur `existingOrders`).
- Scope orgId vérifié via `programTrack.orgId` dans la query — RULE-USR-002.

## Dépendances

- `Class` avec un `programId` attaché
- `ProgramUE` pour connaître les semestres à créer

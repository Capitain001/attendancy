# Service `term`

## Rôle

Gestion des semestres/termes d'une classe. Les terms sont des sous-entités
de `Class` — générés automatiquement depuis le programme attaché à la classe.

## Fichiers

| Fichier | Rôle |
|---|---|
| `actions/term.mutations.ts` | `generateTermsFromProgramAction` — DIRECTION uniquement |
| `database/term.mutations.ts` | `generateTermsFromProgram` — transaction batch creation |
| `cache.ts` | `TERM_GRAPH` → invalide `CACHE.CLASS(orgId)` + `CACHE.CLASS(orgId, classId)` |
| `types.ts` | DTOs |

## Invariants

- Term = semestre numéroté (`order` = numéro de semestre du programUE).
- Idempotent : ne crée que les semestres manquants (filtre sur `existingOrders`).
- Scope orgId vérifié via `programTrack.orgId` dans la query — RULE-USR-002.

## Dépendances

- `Class` avec un `programId` attaché
- `ProgramUE` pour connaître les semestres à créer

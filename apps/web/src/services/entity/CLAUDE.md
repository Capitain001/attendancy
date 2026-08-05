# Service `entity` — RÉFÉRENCE DU PATTERN

Ce service est l'exemple canonique du service module pattern. Tous ses fichiers
sont des implémentations de référence COMMENTÉES — aucun modèle Prisma requis.

## Créer un vrai service à partir de cet exemple

1. Copier le dossier → `src/services/<nom>/`
2. Renommer `entity` → `<model>` dans les noms de fichiers et le code
3. Décommenter et adapter chaque fichier
4. Enregistrer `<SERVICE>_GRAPH` dans `src/cache/server/key.ts` (import + spread)
   et ajouter l'entrée `CACHE.<KEY>` correspondante
5. Écrire son `CLAUDE.md` (rôle, fichiers, extensions, invariants)
6. Renseigner l'ownership dans `src/services/SERVICE_CONTEXT.md`
7. Régénérer : `npx tsx scripts/generate/types/types.ts <nom>` puis
   `npx tsx scripts/generate/api/api.ts <nom>`

## Ordre de lecture des fichiers

| Ordre | Fichier | Illustre |
|---|---|---|
| 1 | `database/entity.queries.ts` | `"use cache"` + cacheTag/cacheLife + select explicite |
| 2 | `database/entity.mutations.ts` | tryConstraint + invalidateEvent + soft delete |
| 3 | `cache.ts` | Graphe d'invalidation + règle cross-service |
| 4 | `validation.ts` | Valibot + convention de nommage |
| 5 | `actions/entity.queries.ts` | Frontière auth (orgId ← token) + `{ data }/{ error }` |
| 6 | `actions/entity.mutations.ts` | Pattern complet mutation + audit |
| 7 | `constants.ts`, `types.ts` | Enums compile-safe + DTOs inférés |

## Règles portées par cet exemple

- 1 modèle Prisma = 1 service ; `prisma.<model>` uniquement dans son owner
- `database/` interne au service — le frontend passe par `actions/`
- `orgId` extrait du token serveur UNIQUEMENT
- Actions : préfixe `get*` (jamais `list*`), suffixe `Action`
- Retour action : `{ data }` / `{ error: string }`

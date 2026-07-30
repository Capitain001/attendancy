# scripts/generate/types

## types.ts

Génère `src/services/<service>/types.ts` depuis `database/*.queries.ts`.

**Pattern de sortie** :
```ts
import { getEnrolledStudents, getStudentProfile } from './database'

export type GetEnrolledStudentsDto = Awaited<ReturnType<typeof getEnrolledStudents>>
export type GetStudentProfileDto   = Awaited<ReturnType<typeof getStudentProfile>>
```

**Usage** :
```
npx tsx scripts/generate/types/types.ts <service>     # un service
npx tsx scripts/generate/types/types.ts svc1 svc2     # plusieurs
npx tsx scripts/generate/types/types.ts --all         # tous les services éligibles
```

**Éligible** : service avec au moins un fichier `database/*.queries.ts`.

**Effet de bord** : ajoute `export * from './types'` dans `index.ts` si présent et si absent.

**Extraction** : regex `^export\s+(?:async\s+)?function\s+(\w+)` — uniquement les `*.queries.ts`.
Les mutations (`*.mutations.ts`) sont exclues intentionnellement (pas de DTO de retour stable).

**Quand lancer** : après ajout ou modification de fonctions dans `database/*.queries.ts`.

## check.ts

Détecte les `export type X = Awaited<ReturnType<...>>` définis hors de `types.ts` — **non bloquant (exit 0)**.

```
npx tsx scripts/generate/types/check.ts              # tous les services
npx tsx scripts/generate/types/check.ts <service>    # un ou plusieurs
```

**Scan** : tous les `.ts` du service sauf `types.ts`, `index.ts`, `.d.ts`, `.test.ts`, `.api/`.

**Fix suggéré** : `npm run generate:types:svc -- <service>` puis supprimer le type de l'ancien fichier.

**Quand lancer** : avant chaque commit sur `src/services/**`, en complément de `naming/check.ts`.

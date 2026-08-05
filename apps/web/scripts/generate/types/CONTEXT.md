# scripts/generate/types

## types.ts

Génère `src/services/<service>/generated.types.ts` depuis `database/*.queries.ts`.

**Pattern de sortie** (`generated.types.ts`, régénéré et écrasé à chaque run) :
```ts
// ⚠ Fichier généré automatiquement — NE PAS ÉDITER À LA MAIN
import { getEnrolledStudents, getStudentProfile } from './database'

export type GetEnrolledStudentsDto = Awaited<ReturnType<typeof getEnrolledStudents>>
export type GetStudentProfileDto   = Awaited<ReturnType<typeof getStudentProfile>>
```

**`types.ts` (barrel manuel, JAMAIS écrasé)** : le script s'assure seulement qu'il contient
`export * from './generated.types'`. Si absent, le script l'ajoute (ou crée le fichier s'il
n'existe pas). Le reste du contenu de `types.ts` — types manuels, surcharges — n'est jamais
touché.

**Usage** :
```
npx tsx scripts/generate/types/types.ts <service>     # un service
npx tsx scripts/generate/types/types.ts svc1 svc2     # plusieurs
npx tsx scripts/generate/types/types.ts --all          # tous les services éligibles
```

**Éligible** : service avec au moins un fichier `database/*.queries.ts`.

**Effets de bord** :
- Ajoute `export * from './generated.types'` dans `types.ts` (créé si absent).
- Ajoute `export * from './types'` dans `index.ts` si présent et absent (inchangé).

**Extraction** : regex `^export\s+(?:async\s+)?function\s+(\w+)` — uniquement les `*.queries.ts`.
Les mutations (`*.mutations.ts`) sont exclues intentionnellement (pas de DTO de retour stable).

**Quand lancer** : après ajout ou modification de fonctions dans `database/*.queries.ts`.

### ⚠ Cas de collision de nom

Si `types.ts` contient déjà un type manuel portant le même nom qu'un DTO généré (ex: vous
avez surchargé `GetEnrolledStudentsDto` à la main), le script **n'ajoute pas** automatiquement
le re-export — il affiche un avertissement listant les noms en conflit et s'arrête là.

Pourquoi : `export * from './generated.types'` + une déclaration manuelle du même nom dans le
même fichier produit une erreur TypeScript de double export. Le script ne peut pas deviner
laquelle des deux définitions doit primer — c'est une décision humaine.

**Résolution manuelle** :
1. Renommez le type manuel dans `types.ts` (ex: `GetEnrolledStudentsDto` → `EnrolledStudentsView`), ou
2. Supprimez-le si le type généré convient désormais, ou
3. Excluez-le explicitement du re-export (`export * from './generated.types'` + `export type { ... } from './generated.types'` en omettant le nom en conflit via un ré-export nommé plutôt qu'un `export *`).

Puis ajoutez vous-même la ligne `export * from './generated.types'` dans `types.ts` et relancez
le script pour confirmer que l'avertissement a disparu.

## check.ts

Détecte les `export type X = Awaited<ReturnType<...>>` définis hors de `generated.types.ts` —
**non bloquant (exit 0)**.

```
npx tsx scripts/generate/types/check.ts              # tous les services
npx tsx scripts/generate/types/check.ts <service>    # un ou plusieurs
```

**Scan** : tous les `.ts` du service sauf `generated.types.ts`, `index.ts`, `.d.ts`, `.test.ts`, `.api/`.
`types.ts` **est scanné** : un type inféré qui y traînerait directement (au lieu d'y être
seulement ré-exporté via `export *`) est signalé comme violation.

**Fix suggéré** : `npm run generate:types:svc -- <service>` puis supprimer le type de l'ancien fichier.

**Quand lancer** : avant chaque commit sur `src/services/**`, en complément de `naming/check.ts`.
```

## Résumé des changements

1. **`generated.types.ts`** devient le fichier régénérable, écrasé sans risque à chaque run.
2. **`types.ts`** n'est plus jamais écrasé — le script y ajoute uniquement `export * from './generated.types'` s'il est absent, ou crée le fichier minimal s'il n'existe pas encore.
3. **Détection de collision** : si un type manuel dans `types.ts` porte le même nom qu'un DTO généré, le script **refuse d'ajouter le re-export** et affiche un avertissement clair avec les noms en conflit, laissant la résolution à un humain plutôt que de deviner.
4. **`check.ts`** cible désormais `generated.types.ts` comme emplacement canonique, et continue de scanner `types.ts` pour repérer un type inféré qui y serait resté "en dur" au lieu d'y être seulement ré-exporté.
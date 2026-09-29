Voici le patch complet, dans l'ordre de dépendance.

## 1. Registre et contrat (côté web) : **DEJA EFFECTUER **

La route ne peut pas exporter `ACTIONS` elle-même : Next n'autorise que certains exports dans un `route.ts`. Le registre passe donc dans son propre fichier.

```typescript
// apps/web/src/app/api/rpc/[action]/actions.ts
import { getSchedulesAction } from '@/services/schedule'
import { getClassesAction } from '@/services/class'

export const ACTIONS = { getSchedulesAction, getClassesAction } as const
```

Dans `route.ts`, remplace les imports de services et la constante locale par :

```typescript
import { ACTIONS } from './actions'
```

```typescript
// apps/web/src/app/api/rpc/[action]/contract.ts
import type { Jsonify } from 'type-fest'
import type { ACTIONS } from './actions'

type Actions = typeof ACTIONS

export type ApiClient = {
  [K in keyof Actions]: (
    ...args: Parameters<Actions[K]>
  ) => Promise<Jsonify<Awaited<ReturnType<Actions[K]>>>>
}

export type ApiAction = keyof ApiClient
export type ApiInput<K extends ApiAction> = Parameters<ApiClient[K]>[0]
export type ApiOutput<K extends ApiAction> = Awaited<ReturnType<ApiClient[K]>>
```

`...args: Parameters<...>` conserve le caractère optionnel de l'input pour les actions sans paramètre. `ApiInput` et `ApiOutput` évitent d'écrire `ApiClient['getSchedulesAction']` partout dans les vues.


## 2. Package `@attendancy/types`  **RESTANT A EFFECTUER **

Le build vit dans `packages/types` (ses outputs restent dans son dossier, ce qui convient à Turbo) mais lit le code de `apps/web`.

```typescript
// packages/types/tsup.config.ts
import { defineConfig } from 'tsup'

export default defineConfig({
  entry: { contract: '../../apps/web/src/app/api/rpc/[action]/contract.ts' },
  tsconfig: '../../apps/web/tsconfig.json', // c'est lui qui résout @/*
  dts: { only: true },
  format: ['esm'],
  clean: true,
})
```

```jsonc
// packages/types/package.json
{
  "name": "@attendancy/types",
  "private": true,
  "types": "./dist/contract.d.ts",
  "exports": { ".": { "types": "./dist/contract.d.ts" } },
  "scripts": { "build:types": "tsup" },
  "dependencies": { "type-fest": "^4" },
  "devDependencies": { "tsup": "^8", "typescript": "^5" }
}
```

L'alias `@/*` est résolu ici avec le tsconfig de `apps/web`, et le `.d.ts` produit n'en contient plus aucun.

## 3. Turbo

```jsonc
// turbo.json (extrait)
{
  "tasks": {
    "build:types": {
      "inputs": ["$TURBO_ROOT$/apps/web/src/**", "$TURBO_ROOT$/apps/web/tsconfig.json", "tsup.config.ts"],
      "outputs": ["dist/**"]
    },
    "desktop#build": { "dependsOn": ["@attendancy/types#build:types"] },
    "desktop#dev":   { "dependsOn": ["@attendancy/types#build:types"] }
  }
}
```

Remplace `desktop` par le vrai nom du package de `apps/desktop`. `$TURBO_ROOT$` demande Turbo 2.x ; sinon, mets les inputs en chemins relatifs `../../apps/web/src/**`.

## 4. Patch du générateur

Deux changements : `import type`, et un scan de `actions/` qui produit `XInput` / `XOutput`. Je factorise le listage des fichiers d'un dossier.

```typescript
// remplace isDbFile + la lecture des dbFiles
function listTsFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".ts") && !EXCLUDED_DB_FILES.has(f))
    .filter((f) => fs.statSync(path.join(dir, f)).isFile());
}

function collectFns(dir: string): string[] {
  const seen = new Set<string>();
  for (const f of listTsFiles(dir)) {
    for (const fn of extractExportedFns(path.join(dir, f))) seen.add(fn);
  }
  return [...seen]; // dédoublonnage (avertissement à conserver si tu veux)
}
```

Dans `generateForService`, remplace le calcul de `fns` par deux listes et construis le fichier ainsi :

```typescript
const dbFns = collectFns(path.join(serviceDir, "database"));
const actionFns = collectFns(path.join(serviceDir, "actions"));

if (!dbFns.length && !actionFns.length) {
  console.log(`  ⚠ ${servicePath} : rien à typer — skip`);
  return true;
}

const lines = [
  `// ⚠ Fichier généré automatiquement — NE PAS ÉDITER À LA MAIN`,
  `// Régénérer : npx tsx scripts/generate/types/types.ts ${servicePath}`,
  `// Pour surcharger un type, définissez-le dans ./types.ts (jamais écrasé).`,
  "",
  ...(dbFns.length ? [`import type { ${dbFns.join(", ")} } from './database'`] : []),
  ...(actionFns.length ? [`import type { ${actionFns.join(", ")} } from './actions'`] : []),
  "",
  ...dbFns.map((fn) => `export type ${toPascalCase(fn)}Dto = Awaited<ReturnType<typeof ${fn}>>`),
  ...actionFns.flatMap((fn) => [
    `export type ${toPascalCase(fn)}Input = Parameters<typeof ${fn}>[0]`,
    `export type ${toPascalCase(fn)}Output = Awaited<ReturnType<typeof ${fn}>>`,
  ]),
  "",
];

const generatedTypeNames = [
  ...dbFns.map((f) => `${toPascalCase(f)}Dto`),
  ...actionFns.flatMap((f) => [`${toPascalCase(f)}Input`, `${toPascalCase(f)}Output`]),
];
```

Deux adaptations selon ton code :

- `collectEligibleServices` doit aussi considérer un service éligible s'il a des fichiers dans `actions/` (aujourd'hui il ne regarde que `database/`).
- Si `actions/` n'a pas de `index.ts`, remplace `'./actions'` par l'import du fichier précis, ou crée le barrel.

Un `XOutput` d'action côté web garde ses vrais `Date` (rendu serveur). Côté Tauri, on utilise `ApiOutput<'getSchedulesAction'>`, qui passe par `Jsonify`. Les deux familles de types ne se mélangent pas.

## 5. Garde-fous côté desktop

```jsonc
// apps/desktop/tsconfig.json → ajouter
"verbatimModuleSyntax": true
```

Ça oblige `import type` pour tout ce qui vient de `@attendancy/types` et empêche d'embarquer du code serveur par erreur.

## À vérifier au premier build

1. `grep "@/" packages/types/dist/contract.d.ts` doit ne rien renvoyer. Sinon, l'alias n'a pas été résolu et il faut passer `dts: { resolve: true }` ou vérifier le chemin du tsconfig.
2. Si `@prisma/client` apparaît en import dans le `.d.ts`, c'est normal tant que Prisma n'est pas dans `packages/db`. Le desktop devra alors l'avoir en dépendance de types. Une fois Prisma déplacé, ce sera `@attendancy/db` en `import type` uniquement.
3. Dans une vue Tauri, `ApiOutput<'getSchedulesAction'>` doit montrer `string` sur les champs date. Si tu vois `Date`, le `Jsonify` n'est pas appliqué.

Quand tu déplaces Prisma dans `packages/db`, envoie-moi le `schema.prisma` et la config actuelle. Je te donne le `output` du client, les scripts `prisma generate` dans Turbo et l'ajustement des imports dans `apps/web`.

##@/generated/prisma/browser'

ex: import { Level } from '@/generated/prisma/browser'

c'est le rôle de l'entrée browser du nouveau générateur prisma-client. Elle exporte les enums (comme valeurs runtime), les types de modèles et le namespace Prisma pour les types, mais pas PrismaClient ni le moteur. C'est donc la bonne source pour tout ce qui doit tourner côté Tauri ou dans une vue partagée.

Ce qui protège quoi
Le .d.ts du contrat est effacé à la compilation, donc rien de Prisma n'est embarqué à l'exécution, quelle que soit l'entrée utilisée. Il peut référencer des types de client sans risque pour le bundle.
Le code desktop qui importe une valeur (un enum comme Level, pour un <select> par exemple) est le seul cas où l'entrée compte. Il doit passer par browser, jamais par client.

verbatimModuleSyntax ne couvre que le premier cas, puisqu'il force import type pour les types. Il ne t'empêche pas d'importer une valeur depuis client, donc ajoute une règle qui l'interdit dans le desktop :

jsonc
// eslint (apps/desktop)
"no-restricted-imports": ["error", {
  "patterns": [{
    "group": ["**/generated/prisma/client", "@attendancy/db"],
    "message": "Utiliser @attendancy/db/browser côté desktop"
  }]
}]
Avec packages/db

Expose les deux entrées via exports, pour que la frontière se lise dans l'import :

jsonc
// packages/db/package.json
"exports": {
  ".":         "./src/generated/client.ts",   // serveur uniquement
  "./browser": "./src/generated/browser.ts"   // enums + types, sûr partout
}
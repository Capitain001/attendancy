# Feature : constantes partagées via `@attendancy/rpc`
NB: cette tache part du prinipe que les constants des service sont ecrite de facon pure , si cen est pas le cas et qu elle fait une dep a next next js ne pas forcer la tache peux attendre 
 
## Objectif

Les `src/services/<x>/constants.ts` (`LEVELS`, `LEVEL_LABEL`, `PERSONAL_ACADEMIC_YEAR`…) s'importent sur le desktop comme sur le web :

```typescript
import { LEVEL_LABEL } from "@/services/class/constants"
```

Ce sont des valeurs runtime, donc elles ne peuvent pas passer par le package `types`. Elles passent par `@attendancy/rpc`, avec un script distinct de celui des actions.

## Principes

1. **Deux scripts, deux dossiers de sortie** : `gen-actions.mjs` (appels RPC) et `gen-constants.mjs` (données). Chacun ne nettoie que son dossier.
2. **Source de vérité = `constants.ts` du web.** Le script en copie le contenu dans le package (commité, en-tête « généré »). Pas de dérive, pas d'import vers `web` au runtime, pas de boucle avec l'alias `@`.
3. **Garde-fou** : le script échoue si un `constants.ts` importe autre chose que `@/generated/prisma/*`. Aucun code serveur ne peut atteindre le bundle Tauri.
4. **Alias Prisma existant respecté** : `@/generated/prisma/*` pointe vers `packages/db/src/generated/*` sur le web et vers `@attendancy/types` sur le desktop.
5. **Tout est statique**, résolu au build.

## Arborescence

```
packages/rpc/
  package.json
  scripts/
    gen-actions.mjs
    gen-constants.mjs
  src/generated/
    actions/schedule.ts      généré, committé
    actions/class.ts
    constants/class.ts       généré, committé
```

## Étapes

### 1. `package.json` du package

```jsonc
// packages/rpc/package.json
{
  "name": "@attendancy/rpc",
  "private": true,
  "type": "module",
  "exports": {
    "./actions/*": "./src/generated/actions/*.ts",
    "./constants/*": "./src/generated/constants/*.ts"
  },
  "scripts": {
    "gen:actions": "node scripts/gen-actions.mjs",
    "gen:constants": "node scripts/gen-constants.mjs",
    "gen": "pnpm gen:actions && pnpm gen:constants"
  }
}
```

### 2. Script des actions

```javascript
// packages/rpc/scripts/gen-actions.mjs
import { readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs'
import path from 'node:path'

const SRC = path.resolve(import.meta.dirname, '../../../apps/web/src/app/api/rpc/actions.ts')
const OUT = path.resolve(import.meta.dirname, '../src/generated/actions')

const src = readFileSync(SRC, 'utf8')
const byService = new Map()

// import { a, b } from '@/services/schedule'  ->  schedule: [a, b]
for (const m of src.matchAll(/import\s*\{([^}]+)\}\s*from\s*['"]@\/services\/([^/'"]+)['"]/g)) {
  const names = m[1].split(',').map((s) => s.trim()).filter(Boolean)
  byService.set(m[2], [...(byService.get(m[2]) ?? []), ...names])
}

if (byService.size === 0) throw new Error(`Aucun import de service trouvé dans ${SRC}`)

rmSync(OUT, { recursive: true, force: true })
mkdirSync(OUT, { recursive: true })

for (const [service, names] of byService) {
  writeFileSync(
    path.join(OUT, `${service}.ts`),
    [
      '// GÉNÉRÉ depuis ACTIONS par scripts/gen-actions.mjs : ne pas éditer',
      "import { api } from '@rpc-api'",
      '',
      ...names.map((n) => `export const ${n} = api.${n}`),
      '',
    ].join('\n'),
  )
}
console.log(`actions: ${byService.size} service(s) généré(s)`)
```

### 3. Script des constantes

```javascript
// packages/rpc/scripts/gen-constants.mjs
import { readdirSync, existsSync, readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs'
import path from 'node:path'

const SERVICES = path.resolve(import.meta.dirname, '../../../apps/web/src/services')
const OUT = path.resolve(import.meta.dirname, '../src/generated/constants')

// Imports tolérés dans un constants.ts partagé :
// - l'alias Prisma (résolu par chaque app vers sa propre cible)
// Un import relatif casserait après la copie ; un import serveur polluerait le bundle Tauri.
const isAllowed = (spec) => spec.startsWith('@/generated/prisma/')

const IMPORT_RE = /^\s*(?:import|export)\s[^'"]*?from\s*['"]([^'"]+)['"]/gm

const errors = []
const found = []

for (const dir of readdirSync(SERVICES, { withFileTypes: true })) {
  if (!dir.isDirectory()) continue
  const file = path.join(SERVICES, dir.name, 'constants.ts')
  if (!existsSync(file)) continue

  const content = readFileSync(file, 'utf8')
  for (const m of content.matchAll(IMPORT_RE)) {
    if (!isAllowed(m[1])) errors.push(`services/${dir.name}/constants.ts : import non autorisé "${m[1]}"`)
  }
  found.push({ service: dir.name, content })
}

if (errors.length) throw new Error(`gen-constants :\n- ${errors.join('\n- ')}`)
if (found.length === 0) throw new Error(`Aucun constants.ts trouvé dans ${SERVICES}`)

rmSync(OUT, { recursive: true, force: true })
mkdirSync(OUT, { recursive: true })

for (const { service, content } of found) {
  writeFileSync(
    path.join(OUT, `${service}.ts`),
    `// GÉNÉRÉ depuis src/services/${service}/constants.ts par scripts/gen-constants.mjs : ne pas éditer\n${content}`,
  )
}
console.log(`constants: ${found.length} fichier(s) généré(s)`)
```

Résultat pour ton exemple : `packages/rpc/src/generated/constants/class.ts` contient le fichier à l'identique, y compris `import { Level } from '@/generated/prisma/browser'`.

### 4. Web : rien à changer

L'alias `@/generated/prisma/*` → `../../packages/db/src/generated/*` et les `constants.ts` restent tels quels. Il ajoute seulement le déclenchement de la génération :

```jsonc
// apps/web/package.json
"scripts": {
  "predev": "pnpm --filter @attendancy/rpc gen",
  "prebuild": "pnpm --filter @attendancy/rpc gen"
}
```

### 5. Desktop : alias et paths

```typescript
// apps/desktop/vite.config.ts
import path from 'node:path'

export default defineConfig({
  resolve: {
    alias: [
      { find: /^@\/services\/([^/]+)\/actions$/, replacement: '@attendancy/rpc/actions/$1' },
      { find: /^@\/services\/([^/]+)\/constants$/, replacement: '@attendancy/rpc/constants/$1' },
      // même alias que le web, cible différente : le package types
      { find: /^@\/generated\/prisma\/.+$/, replacement: '@attendancy/types' },
      { find: '@rpc-api', replacement: path.resolve(__dirname, 'src/lib/api.ts') },
      { find: '@', replacement: path.resolve(__dirname, '../web/src') },
    ],
  },
})
```

```jsonc
// apps/desktop/tsconfig.json
"paths": {
  "@/services/*/actions": ["../../packages/rpc/src/generated/actions/*.ts"],
  "@/services/*/constants": ["../../packages/rpc/src/generated/constants/*.ts"],
  "@/generated/prisma/*": ["../../packages/types/src/index.ts"],
  "@rpc-api": ["./src/lib/api.ts"],
  "@/*": ["../web/src/*"]
}
```

Dans `paths`, une cible doit être un chemin de fichier, pas un nom de package. Remplace `../../packages/types/src/index.ts` par le vrai point d'entrée de `@attendancy/types`.

L'ordre compte : les alias spécifiques d'abord, `@` en dernier.

```jsonc
// apps/desktop/package.json
"dependencies": { "@attendancy/rpc": "workspace:*" }
```

## Ajouter une constante ou un service

1. Écrire ou modifier `src/services/<x>/constants.ts` côté web, avec seulement des imports `@/generated/prisma/*`.
2. Relancer `dev` côté web, ou `pnpm --filter @attendancy/rpc gen`.
3. Committer `packages/rpc/src/generated/`.

## Critères de validation

- `pnpm --filter @attendancy/rpc gen` produit `generated/actions/*.ts` et `generated/constants/*.ts`.
- Un `constants.ts` qui importe un module non autorisé fait échouer `gen:constants`.
- `LEVELS` et `LEVEL_LABEL` s'importent sur le desktop depuis `@/services/class/constants`, avec les mêmes valeurs que sur le web.
- Un service sans `constants.ts` fait échouer le build s'il est importé.
- Les actions continuent de fonctionner sous `actions/`.

## NB

- **`@attendancy/types` doit exporter `Level` comme valeur**, pas seulement comme type, car `Object.values(Level)` et `[Level.L1]` s'exécutent au runtime. Si ce package ne contient que des déclarations, remplace la cible desktop par la même que le web :
  ```typescript
  { find: /^@\/generated\/prisma\/(.+)$/, replacement: path.resolve(__dirname, '../../packages/db/src/generated/$1') }
  ```
  avec `"@/generated/prisma/*": ["../../packages/db/src/generated/*"]` dans `paths`. Le point d'entrée `browser` ne contient pas de code serveur.
- **Seul `constants.ts` à la racine d'un service est partagé.** Un autre fichier (`labels.ts`, `config.ts`) n'est pas repris tant que le script n'est pas étendu.
- **Les constantes sont copiées.** Une modification côté web n'apparaît sur le desktop qu'après `gen`, que le `predev`/`prebuild` web déclenche.
- **Les dates de `PERSONAL_ACADEMIC_YEAR` sont construites au chargement du module**, donc identiques sur web et desktop. Elles ne passent pas par le réseau, le `reviver` ISO n'est pas concerné.
# Feature : actions partagées web / desktop

## Objectif

Les hooks partagés (`useSchedules`, etc.) s'écrivent à l'identique sur le web et sur le desktop (Tauri) :

```typescript
import { getSchedulesAction } from "@/services/schedule/actions"
```

- **Web** : l'import résout la vraie server action Next.js.
- **Desktop** : l'import résout un stub `export const getSchedulesAction = api.getSchedulesAction`, qui fait l'appel RPC.

## Principes

1. **Source unique des noms** : `ACTIONS` (web). Aucune liste écrite à la main.
2. **Tout est statique, résolu au build** : pas de `configureRpc`, pas d'état d'initialisation au runtime.
3. **Le desktop ne connaît pas `web/src/app`** : il consomme le package `@attendancy/rpc` comme il consomme `@attendancy/types`.
4. **Les hooks restent dans `apps/web/src/hooks`** : le build Vite desktop les compile directement depuis les sources web via l'alias `@`. Cette tâche ne migre pas les hooks vers `packages/ui` ou `packages/planning`.
5. **Transport inchangé** : `apps/desktop/src/lib/api.ts` garde le Bearer, le refresh sur 401 et l'exception `NetworkError` hors ligne.

## Arborescence

```
packages/rpc/
  package.json
  scripts/gen.mjs             lit ACTIONS, écrit les stubs
  src/generated/schedule.ts   généré, committé
  src/generated/class.ts      généré, committé
apps/web/src/lib/rpc/actions.ts          ACTIONS (source des noms)
apps/web/src/lib/rpc/contract.ts         contrat de types (inclut les types dérivés de validation)
apps/desktop/vite.config.ts              alias
apps/desktop/tsconfig.json                paths
```

## Étapes

### 1. Web : publier les actions utilisées par les hooks

```typescript
// apps/web/src/lib/rpc/actions.ts
import { getSchedulesAction } from '@/services/schedule'
import { getClassesAction } from '@/services/class'

export const ACTIONS = { getSchedulesAction, getClassesAction } as const
```

N'ajouter au registre que les actions nécessaires aux hooks partagés. Le transport transmet un argument JSON par appel ; les signatures existantes (objet, chaîne ou argument absent) sont préservées.

### 2. Créer le package `@attendancy/rpc`

```jsonc
// packages/rpc/package.json
{
  "name": "@attendancy/rpc",
  "private": true,
  "type": "module",
  "exports": { "./*": "./src/generated/*.ts" },
  "scripts": { "gen": "node scripts/gen.mjs" }
}
```

### 3. Script de génération

`packages/rpc/scripts/gen.mjs` lit le registre `ACTIONS` et les imports directs de services dans `apps/web/src/lib/rpc/actions.ts`.

- Il valide que chaque action publiée dans `ACTIONS` est importée d'un service.
- Il produit un stub par service et n'écrit que les membres du registre.
- Il enlève les anciens fichiers TypeScript générés sans effacer le dossier de sortie.
- Il échoue explicitement sur un registre absent/vide ou un nom non pris en charge.

La génération est déterministe et peut être relancée avec `bun --filter @attendancy/rpc gen`.

Fichier produit :

```typescript
// packages/rpc/src/generated/schedule.ts
import { api } from '@rpc-api'

export const getSchedulesAction = api.getSchedulesAction
export const createScheduleAction = api.createScheduleAction
export const updateScheduleAction = api.updateScheduleAction
export const deleteScheduleAction = api.deleteScheduleAction
```

`@rpc-api` est un nom d'alias, pas un vrai package : chaque app le résout vers son propre client.

### 4. Déclencher la génération depuis le web

Le web possède `ACTIONS`, c'est lui qui régénère. Les scripts `dev` et `build` de `apps/web/package.json` exécutent explicitement `bun --filter @attendancy/rpc gen` avant Next.js (y compris quand la tâche est lancée par Turbo). Les fichiers générés sont committés, donc le desktop n'a rien à lancer.

### 5. Brancher le desktop (configuration seulement)

```typescript
// apps/desktop/vite.config.ts
import path from 'node:path'

export default defineConfig({
  resolve: {
    alias: [
      // l'ordre compte : le premier alias qui correspond gagne
      {
        find: /^@\/services\/([^/]+)\/actions$/,
        replacement: path.resolve(__dirname, '../../packages/rpc/src/generated/$1.ts'),
      },
      { find: '@rpc-api', replacement: path.resolve(__dirname, 'src/lib/api.ts') },
      { find: '@ui', replacement: path.resolve(__dirname, '../../packages/ui/src') },
      { find: '@', replacement: path.resolve(__dirname, '../web/src') },
    ],
  },
})
```

```jsonc
// apps/desktop/tsconfig.json
"paths": {
  "@/services/*/actions": ["../../packages/rpc/src/generated/*.ts"],
  "@attendancy/rpc/*": ["../../packages/rpc/src/generated/*.ts"],
  "@rpc-api": ["./src/lib/api.ts"],
  "@/*": ["../web/src/*"]
}
```

```jsonc
// apps/desktop/package.json
"dependencies": { "@attendancy/rpc": "workspace:*" }
```

### 6. Contrat d'erreur hors ligne

En cas de panne réseau, `apps/desktop/src/lib/api.ts` lève `NetworkError`. Ne pas convertir cette exception en `{ error }` : React Query doit voir une erreur de requête afin de conserver les données persistées en cache hors ligne. Les erreurs applicatives d'une action restent au format `{ error }`.

### 7. Règles pour les hooks partagés

- Depuis `@/services/...`, uniquement des `import type`, sauf `@/services/<x>/actions`. Un import de valeur depuis `validation` ou `index` embarquerait du code serveur (Prisma, Supabase serveur) dans le bundle Tauri.
- Aucun import `next/*`, y compris dans `useCrudEntity` et `actionHelpers`.
- Chaque appel RPC transmet au plus un argument JSON (`input` dans `api.ts`). Cet argument peut être un objet ou une valeur primitive selon la signature de l'action ; les actions à plusieurs paramètres doivent être adaptées avant inscription.
- Les types de saisie partagés proviennent des schémas Valibot de `services/<service>/validation.ts` et sont ré-exportés par `@attendancy/types` ; ne pas dupliquer leurs champs dans les hooks.

## Ajouter une action

1. L'ajouter dans `ACTIONS`.
2. Relancer `dev` côté web ou exécuter `bun --filter @attendancy/rpc gen`.
3. Committer `packages/rpc/src/generated/`.
4. L'importer dans le hook depuis `@/services/<x>/actions`.

## Critères de validation

- `bun --filter @attendancy/rpc gen` produit un fichier par service présent dans `ACTIONS`.
- Le desktop compile sans qu'aucun fichier ne référence `web/src/app`.
- Un hook qui importe une action absente de `ACTIONS` fait échouer le build (aucun stub correspondant n'est généré).
- `useSchedules` est identique sur web et desktop.
- Hors ligne, un fetch lève `NetworkError`, sans remplacer les données React Query en cache.

## NB

- `gen.mjs` lit `apps/web/src/lib/rpc/actions.ts` à la génération ; ce fichier n'est pas une dépendance du bundle desktop.
- Les hooks restent dans `apps/web/src/hooks`. L'alias d'actions, prioritaire sur `@`, les redirige vers les stubs RPC générés. Tout import runtime d'un module `next/*` ou d'un module serveur depuis un hook doit être éliminé ou isolé avant que ce hook soit consommé côté desktop.
- Si les stubs committés ne sont pas régénérés après une modification d'`ACTIONS`, ils dérivent. Les scripts `dev` et `build` du web les régénèrent avant utilisation.
- Le `reviver` ISO de `api.ts` transforme en `Date` toute chaîne qui ressemble à une date ISO, y compris un champ texte libre qui aurait ce format.
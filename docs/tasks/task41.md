quelque esquises de reflexion qui on servit a l implementation elle t aiderons a retrouver 

packages\rpc\scripts\gen.mjs

1. Script de génération
javascript
// apps/desktop/scripts/gen-rpc.mjs
import { readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs'
import path from 'node:path'

const root = path.resolve(import.meta.dirname, '..')
const SRC = path.resolve(root, '../web/src/app/api/rpc/actions.ts')
const OUT = path.resolve(root, 'src/rpc')

const src = readFileSync(SRC, 'utf8')
const byService = new Map()

// import { a, b } from '@/services/schedule'  ->  schedule: [a, b]
for (const m of src.matchAll(/import\s*\{([^}]+)\}\s*from\s*['"]@\/services\/([^/'"]+)['"]/g)) {
  const names = m[1].split(',').map((s) => s.trim()).filter(Boolean)
  byService.set(m[2], [...(byService.get(m[2]) ?? []), ...names])
}

if (byService.size === 0) throw new Error(`Aucun import de service trouvé dans ${SRC}`)

// repartir de zéro : un service retiré de ACTIONS ne laisse pas de stub orphelin
rmSync(OUT, { recursive: true, force: true })
mkdirSync(OUT, { recursive: true })

for (const [service, names] of byService) {
  writeFileSync(
    path.join(OUT, `${service}.ts`),
    [
      '// GÉNÉRÉ depuis ACTIONS par scripts/gen-rpc.mjs : ne pas éditer',
      "import { api } from '../lib/api'",
      '',
      ...names.map((n) => `export const ${n} = api.${n}`),
      '',
    ].join('\n'),
  )
}
console.log(`rpc: ${byService.size} service(s) généré(s)`)

Résultat :

typescript
// apps/desktop/src/rpc/schedule.ts
import { api } from '../lib/api'

export const getSchedulesAction = api.getSchedulesAction
export const createScheduleAction = api.createScheduleAction
export const updateScheduleAction = api.updateScheduleAction
export const deleteScheduleAction = api.deleteScheduleAction

Le Proxy de api ne lit le token qu’à l’appel de la fonction, donc ces export const peuvent être évalués à l’import sans rien configurer.

2. Branchement
typescript
// apps/desktop/vite.config.ts
import path from 'node:path'

export default defineConfig({
  resolve: {
    alias: [
      { find: /^@\/services\/([^/]+)\/actions$/, replacement: path.resolve(__dirname, 'src/rpc/$1.ts') },
      { find: '@', replacement: path.resolve(__dirname, '../web/src') },
    ],
  },
})
jsonc
// apps/desktop/tsconfig.json
"paths": {
  "@/services/*/actions": ["./src/rpc/*.ts"],
  "@/*": ["../web/src/*"]
}
jsonc
// apps/desktop/package.json
"scripts": {
  "gen:rpc": "node scripts/gen-rpc.mjs",
  "predev": "npm run gen:rpc",
  "prebuild": "npm run gen:rpc"
}
# apps/desktop/.gitignore

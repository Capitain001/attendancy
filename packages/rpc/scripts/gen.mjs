import {
  mkdirSync,
  readFileSync,
  readdirSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs'
import path from 'node:path'

const ROOT = path.resolve(import.meta.dirname, '../../..')
const SRC = path.join(ROOT, 'apps/web/src/lib/rpc/actions.ts')
const OUT = path.join(ROOT, 'packages/rpc/src/generated')
const source = readFileSync(SRC, 'utf8')
const byService = new Map()
const imports = new Map()

for (const match of source.matchAll(
  /import\s*\{([^}]+)\}\s*from\s*['"]@\/services\/([^/'"]+)['"]/g,
)) {
  const service = match[2]
  const names = match[1]
    .split(',')
    .map((name) => name.trim())
    .filter(Boolean)

  for (const name of names) {
    if (!/^[A-Za-z_$][\w$]*$/.test(name)) {
      throw new Error(`Nom d'action non pris en charge dans ${SRC}: ${name}`)
    }
    if (imports.has(name)) {
      throw new Error(`Action importée depuis plusieurs services dans ${SRC}: ${name}`)
    }
    imports.set(name, service)
  }

  byService.set(service, byService.get(service) ?? [])
}

const registryMatch = source.match(
  /export\s+const\s+ACTIONS\s*=\s*\{([\s\S]*?)\}\s*as\s+const/,
)
if (!registryMatch) {
  throw new Error(`Registre ACTIONS introuvable ou non pris en charge dans ${SRC}`)
}

const actionNames = registryMatch[1]
  .split(',')
  .map((name) => name.trim())
  .filter(Boolean)

if (actionNames.length === 0) {
  throw new Error(`Le registre ACTIONS est vide dans ${SRC}`)
}

for (const name of actionNames) {
  if (!/^[A-Za-z_$][\w$]*$/.test(name)) {
    throw new Error(`Nom d'action non pris en charge dans ACTIONS: ${name}`)
  }
  const service = imports.get(name)
  if (!service) {
    throw new Error(`Action de ACTIONS non importée depuis un service: ${name}`)
  }
  byService.get(service).push(name)
}

mkdirSync(OUT, { recursive: true })
for (const file of readdirSync(OUT)) {
  if (file.endsWith('.ts')) unlinkSync(path.join(OUT, file))
}

for (const [service, names] of byService) {
  const uniqueNames = [...new Set(names)]
  writeFileSync(
    path.join(OUT, `${service}.ts`),
    [
      '// Generated from apps/web/src/lib/rpc/actions.ts; do not edit.',
      "import { api } from '@rpc-api'",
      '',
      ...uniqueNames.map((name) => `export const ${name} = api.${name}`),
      '',
    ].join('\n'),
  )
}

console.log(`rpc: ${byService.size} service(s) generated`)

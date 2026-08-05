// scripts/temps/check-alias-export.ts
// Détecte les alias exports (export { fn as alias }) dans les fichiers 'use server'.
// Turbopack masque le nom original dans le bundle client.
// Correctif : export const alias = fn
// Non bloquant (exit 0). Rapport uniquement.
//
// Usage :
//   npx tsx scripts/temps/check-alias-export.ts
//   npx tsx scripts/temps/check-alias-export.ts schedule

import * as fs   from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname  = path.dirname(__filename)
const ROOT       = path.resolve(__dirname, '../../')
const SERVICES   = path.join(ROOT, 'src/services')

const COLORS = {
  reset: '\x1b[0m', bold: '\x1b[1m', dim: '\x1b[2m',
  green: '\x1b[32m', yellow: '\x1b[33m', red: '\x1b[31m',
}
const c = (k: keyof typeof COLORS, s: string) => `${COLORS[k]}${s}${COLORS.reset}`

// export { foo as bar } — exclut export type { ... }
const ALIAS_RE = /^export\s+\{[^}]*\b\w+\s+as\s+\w+[^}]*\}/

// ── Parcours ──────────────────────────────────────────────────────────────────

function walkTs(dir: string, out: string[] = []): string[] {
  let entries: fs.Dirent[]
  try { entries = fs.readdirSync(dir, { withFileTypes: true }) } catch { return out }
  for (const e of entries) {
    const full = path.join(dir, e.name)
    if (e.isDirectory()) walkTs(full, out)
    else if (e.isFile() && e.name.endsWith('.ts')) out.push(full)
  }
  return out
}

const filter  = process.argv.slice(2).filter(a => !a.startsWith('--'))
const services: string[] = filter.length
  ? filter.map(s => path.join(SERVICES, s))
  : (() => { try { return fs.readdirSync(SERVICES).map(s => path.join(SERVICES, s)) } catch { return [] } })()

const files = services.flatMap(s => walkTs(s))

// ── Analyse ───────────────────────────────────────────────────────────────────

type Hit = { file: string; line: number; text: string }
const hits: Hit[] = []

for (const file of files) {
  const content = fs.readFileSync(file, 'utf-8')
  if (!content.includes("'use server'") && !content.includes('"use server"')) continue
  const lines = content.split('\n')
  lines.forEach((text, i) => {
    if (ALIAS_RE.test(text.trim())) {
      hits.push({ file: path.relative(ROOT, file), line: i + 1, text: text.trim() })
    }
  })
}

// ── Rapport ───────────────────────────────────────────────────────────────────

console.log(c('bold', '\n── check-alias-export ───────────────────────────────────────\n'))

if (hits.length === 0) {
  console.log(c('green', '✓ Aucun alias export détecté dans les fichiers use server.\n'))
  process.exit(0)
}

console.log(c('yellow', `⚠  ${hits.length} occurrence(s) — remplacer par: export const alias = fn\n`))
for (const h of hits) {
  console.log(c('red', `  ${h.file}:${h.line}`))
  console.log(c('dim', `  ${h.text}\n`))
}

process.exit(0)

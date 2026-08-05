// scripts/temps/check-vparse.ts
// Détecte v.parse() dans les actions/ de services — doit être v.safeParse().
// Non bloquant (exit 0). Rapport uniquement.
//
// Usage :
//   npx tsx scripts/temps/check-vparse.ts
//   npx tsx scripts/temps/check-vparse.ts schedule room

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

// ── Parcours fichiers ─────────────────────────────────────────────────────────

function collectActionFiles(dir: string, out: string[] = []): string[] {
  let entries: fs.Dirent[]
  try { entries = fs.readdirSync(dir, { withFileTypes: true }) } catch { return out }
  for (const e of entries) {
    const full = path.join(dir, e.name)
    if (e.isDirectory()) collectActionFiles(full, out)
    else if (e.isFile() && e.name.endsWith('.ts') && dir.includes(`${path.sep}actions`)) out.push(full)
    else if (e.isDirectory() && e.name === 'actions') collectActionFiles(full, out)
  }
  return out
}

function walkServices(filter?: string[]): string[] {
  const files: string[] = []
  let services: string[]
  try { services = fs.readdirSync(SERVICES) } catch { return [] }
  for (const svc of services) {
    if (filter && !filter.includes(svc)) continue
    const actDir = path.join(SERVICES, svc, 'actions')
    if (!fs.existsSync(actDir)) continue
    for (const f of fs.readdirSync(actDir)) {
      if (f.endsWith('.ts')) files.push(path.join(actDir, f))
    }
  }
  return files
}

// ── Analyse ───────────────────────────────────────────────────────────────────

const filter = process.argv.slice(2).filter(a => !a.startsWith('--'))
const files  = walkServices(filter.length ? filter : undefined)

type Hit = { file: string; line: number; text: string }
const hits: Hit[] = []

for (const file of files) {
  const lines = fs.readFileSync(file, 'utf-8').split('\n')
  lines.forEach((text, i) => {
    if (/\bv\.parse\(/.test(text) && !/\bv\.safeParse\(/.test(text)) {
      hits.push({ file: path.relative(ROOT, file), line: i + 1, text: text.trim() })
    }
  })
}

// ── Rapport ───────────────────────────────────────────────────────────────────

console.log(c('bold', '\n── check-vparse ─────────────────────────────────────────────\n'))

if (hits.length === 0) {
  console.log(c('green', '✓ Aucun v.parse() détecté dans les actions.\n'))
  process.exit(0)
}

console.log(c('yellow', `⚠  ${hits.length} occurrence(s) — remplacer par v.safeParse()\n`))
for (const h of hits) {
  console.log(c('red', `  ${h.file}:${h.line}`))
  console.log(c('dim', `  ${h.text}\n`))
}

process.exit(0)

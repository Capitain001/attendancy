// scripts/temps/check-auth-in-try.ts
// Détecte authAccess() ou getUserInfo() appelés à l'intérieur d'un bloc try{}
// dans les actions/ de services. L'auth doit être AVANT le try.
// Non bloquant (exit 0). Rapport uniquement.
//
// Usage :
//   npx tsx scripts/temps/check-auth-in-try.ts
//   npx tsx scripts/temps/check-auth-in-try.ts schedule room

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

const AUTH_CALL = /\b(authAccess|getUserInfo)\s*\(/

// ── Analyse par suivi de profondeur d'accolades ───────────────────────────────

type Hit = { file: string; line: number; call: string; text: string }

function checkFile(filePath: string): Hit[] {
  const lines = fs.readFileSync(filePath, 'utf-8').split('\n')
  const hits: Hit[] = []

  // tryStack : profondeur minimale pour rester dans ce try
  const tryStack: number[] = []
  let depth = 0

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const opens  = (line.match(/\{/g) ?? []).length
    const closes = (line.match(/\}/g) ?? []).length

    // try { détecté → enregistrer profondeur interne (depth + 1 après l'ouverture)
    if (/\btry\s*\{/.test(line)) tryStack.push(depth + 1)

    depth += opens - closes

    // Retirer les try dont on est sorti
    while (tryStack.length && depth < tryStack[tryStack.length - 1]) tryStack.pop()

    // Vérifier appel auth dans un try
    if (tryStack.length) {
      const m = AUTH_CALL.exec(line)
      if (m) hits.push({ file: path.relative(ROOT, filePath), line: i + 1, call: m[1], text: line.trim() })
    }
  }

  return hits
}

// ── Parcours ──────────────────────────────────────────────────────────────────

const filter = process.argv.slice(2).filter(a => !a.startsWith('--'))
const allHits: Hit[] = []

const services: string[] = filter.length
  ? filter
  : (() => { try { return fs.readdirSync(SERVICES) } catch { return [] } })()

for (const svc of services) {
  const actDir = path.join(SERVICES, svc, 'actions')
  if (!fs.existsSync(actDir)) continue
  for (const f of fs.readdirSync(actDir)) {
    if (!f.endsWith('.ts')) continue
    allHits.push(...checkFile(path.join(actDir, f)))
  }
}

// ── Rapport ───────────────────────────────────────────────────────────────────

console.log(c('bold', '\n── check-auth-in-try ────────────────────────────────────────\n'))

if (allHits.length === 0) {
  console.log(c('green', "✓ Aucun appel auth détecté à l'intérieur d'un try{}.\n"))
  process.exit(0)
}

console.log(c('yellow', `⚠  ${allHits.length} occurrence(s) — déplacer avant le bloc try\n`))
for (const h of allHits) {
  console.log(c('red', `  ${h.file}:${h.line}  [${h.call}]`))
  console.log(c('dim', `  ${h.text}\n`))
}

process.exit(0)

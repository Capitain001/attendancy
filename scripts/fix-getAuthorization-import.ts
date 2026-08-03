// scripts/fix-getAuthorization-import.ts
// ============================================================================
// CORRECTION DES IMPORTS getAuthorization
// ============================================================================
// Corrige les imports de getAuthorization qui ont été mal dirigés vers @/modules/user
// pour les remettre vers @/modules/auth
//
// Usage : npx tsx scripts/fix-getAuthorization-import.ts
//         npx tsx scripts/fix-getAuthorization-import.ts --dry-run
// ============================================================================

import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// ============================================================================
// CONFIGURATION
// ============================================================================

const DRY_RUN = process.argv.includes('--dry-run')

const COLORS = {
  reset: '\x1b[0m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  magenta: '\x1b[35m',
  bold: '\x1b[1m',
}

function log(color: keyof typeof COLORS, ...args: any[]) {
  console.log(COLORS[color], ...args, COLORS.reset)
}

// ============================================================================
// FONCTIONS
// ============================================================================

function getProjectRoot(): string {
  let current = __dirname
  while (current && !fs.existsSync(path.join(current, 'package.json'))) {
    const parent = path.dirname(current)
    if (parent === current) {
      throw new Error('Impossible de trouver la racine du projet (package.json introuvable)')
    }
    current = parent
  }
  return current
}

function findFiles(rootPath: string): string[] {
  const files: string[] = []
  const extensions = ['.ts', '.tsx']
  const excludeDirs = ['node_modules', '.next', 'dist', 'build', 'out', '.git', 'coverage', '.turbo']

  function walk(dir: string) {
    const entries = fs.readdirSync(dir, { withFileTypes: true })
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        if (!excludeDirs.includes(entry.name)) {
          walk(fullPath)
        }
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name)
        if (extensions.includes(ext)) {
          try {
            const content = fs.readFileSync(fullPath, 'utf-8')
            // Chercher les imports de getAuthorization depuis @/modules/user
            if (
              content.includes('getAuthorization') &&
              content.includes('@/modules/user')
            ) {
              files.push(fullPath)
            }
          } catch (_) {
            // Ignorer les fichiers inaccessibles
          }
        }
      }
    }
  }

  walk(rootPath)
  return files
}

function fixImports(filePath: string, dryRun: boolean): { fixed: number; changed: boolean } {
  const content = fs.readFileSync(filePath, 'utf-8')
  let newContent = content
  let fixed = 0

  // Pattern 1: import { getAuthorization } from '@/modules/user'
  const pattern1 = /import\s*{\s*getAuthorization\s*}\s*from\s*['"]@\/modules\/user['"]/g
  if (pattern1.test(newContent)) {
    newContent = newContent.replace(
      /import\s*{\s*getAuthorization\s*}\s*from\s*['"]@\/modules\/user['"]/g,
      "import { getAuthorization } from '@/modules/auth'"
    )
    fixed++
  }

  // Pattern 2: import { getAuthorization, ... } from '@/modules/user'
  const pattern2 = /import\s*{\s*([^}]*getAuthorization[^}]*)\s*}\s*from\s*['"]@\/modules\/user['"]/g
  if (pattern2.test(newContent)) {
    newContent = newContent.replace(
      /import\s*{\s*([^}]*getAuthorization[^}]*)\s*}\s*from\s*['"]@\/modules\/user['"]/g,
      (match, imports) => {
        // Extraire les autres imports sauf getAuthorization
        const otherImports = imports.split(',').filter((i: string) => !i.includes('getAuthorization')).map((i: string) => i.trim()).join(', ')
        
        // Si y a d'autres imports, les garder dans @/modules/user
        if (otherImports) {
          return `import { getAuthorization } from '@/modules/auth'\nimport { ${otherImports} } from '@/modules/user'`
        }
        return "import { getAuthorization } from '@/modules/auth'"
      }
    )
    fixed++
  }

  // Pattern 3: import type { getAuthorization } from '@/modules/user' (moins probable mais on gère)
  const pattern3 = /import\s+type\s*{\s*getAuthorization\s*}\s*from\s*['"]@\/modules\/user['"]/g
  if (pattern3.test(newContent)) {
    newContent = newContent.replace(
      /import\s+type\s*{\s*getAuthorization\s*}\s*from\s*['"]@\/modules\/user['"]/g,
      "import type { getAuthorization } from '@/modules/auth'"
    )
    fixed++
  }

  if (fixed > 0) {
    const relativePath = path.relative(process.cwd(), filePath)
    log('magenta', `  ✏️  ${relativePath} (${fixed} correction${fixed > 1 ? 's' : ''})`)

    if (!dryRun) {
      fs.writeFileSync(filePath, newContent, 'utf-8')
    }
    return { fixed, changed: true }
  }

  return { fixed: 0, changed: false }
}

// ============================================================================
// EXÉCUTION PRINCIPALE
// ============================================================================

function main() {
  console.log('')
  log('cyan', '========================================')
  log('cyan', 'CORRECTION DES IMPORTS getAuthorization')
  log('cyan', '========================================')
  log('cyan', '  getAuthorization → @/modules/auth (au lieu de @/modules/user)')
  console.log('')

  if (DRY_RUN) {
    log('yellow', '🔍 MODE SIMULATION (Dry Run) - Aucun fichier ne sera modifié')
  } else {
    log('green', '🔧 MODE ACTIF - Les fichiers seront modifiés')
  }
  console.log('')

  try {
    const projectRoot = getProjectRoot()
    log('cyan', `📁 Racine du projet : ${projectRoot}`)
    console.log('')

    process.chdir(projectRoot)

    log('cyan', '📂 Recherche des fichiers contenant des imports erronés de getAuthorization...')
    const files = findFiles(projectRoot)
    log('green', `✅ Trouvé ${files.length} fichier(s) à corriger`)
    console.log('')

    if (files.length === 0) {
      log('green', '✅ Aucun fichier à corriger !')
      return
    }

    log('cyan', '========================================')
    log('cyan', 'CORRECTION DES FICHIERS')
    log('cyan', '========================================')
    console.log('')

    let totalFixed = 0
    let totalFiles = 0

    for (const file of files) {
      const result = fixImports(file, DRY_RUN)
      if (result.changed) {
        totalFixed += result.fixed
        totalFiles++
      }
    }

    console.log('')
    log('cyan', '========================================')
    log('cyan', 'RÉSULTAT')
    log('cyan', '========================================')

    if (DRY_RUN) {
      log('yellow', '🔍 Simulation terminée !')
      log('cyan', `   Fichiers à modifier : ${totalFiles}`)
      log('cyan', `   Corrections à appliquer : ${totalFixed}`)
      console.log('')
      log('cyan', '   Pour appliquer les changements, exécutez :')
      log('cyan', '   npx tsx scripts/fix-getAuthorization-import.ts')
    } else {
      log('green', '✅ Correction terminée !')
      log('cyan', `   Fichiers modifiés : ${totalFiles}`)
      log('cyan', `   Corrections appliquées : ${totalFixed}`)
    }

    console.log('')
  } catch (error) {
    log('red', `❌ Erreur : ${error instanceof Error ? error.message : String(error)}`)
    process.exit(1)
  }
}

main()
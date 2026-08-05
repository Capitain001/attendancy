// scripts/fix-authAccess-imports.ts
// ============================================================================
// MIGRATION VERS authAccess DANS src/services
// ============================================================================
// Identifie et corrige les fichiers qui utilisent encore l'ancienne convention
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
const FIX = process.argv.includes('--fix')

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
// ANALYSE DES FICHIERS
// ============================================================================

interface FileAnalysis {
  path: string
  usesOldConvention: boolean
  usesNewConvention: boolean
  needsFix: boolean
  hasGetUserInfo: boolean
  hasGetAuthorization: boolean
  hasAuthAccess: boolean
}

function analyzeFile(filePath: string): FileAnalysis {
  const content = fs.readFileSync(filePath, 'utf-8')
  
  const hasGetUserInfo = content.includes('getUserInfo(')
  const hasGetAuthorization = content.includes('getAuthorization(')
  const hasAuthAccess = content.includes('authAccess(')
  
  // Utilise l'ancienne convention s'il y a getUserInfo ou getAuthorization
  const usesOldConvention = hasGetUserInfo || hasGetAuthorization
  
  // Utilise la nouvelle convention s'il y a authAccess
  const usesNewConvention = hasAuthAccess
  
  // A besoin d'être corrigé s'il utilise l'ancienne convention
  const needsFix = usesOldConvention

  return {
    path: filePath,
    usesOldConvention,
    usesNewConvention,
    needsFix,
    hasGetUserInfo,
    hasGetAuthorization,
    hasAuthAccess,
  }
}

function findFiles(rootPath: string): string[] {
  const files: string[] = []
  const extensions = ['.ts', '.tsx']
  const excludeDirs = ['node_modules', '.next', 'dist', 'build', 'out', '.git', 'coverage', '.turbo', '__tests__']

  function walk(dir: string) {
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true })
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name)
        if (entry.isDirectory()) {
          if (!excludeDirs.includes(entry.name) && !entry.name.startsWith('.')) {
            walk(fullPath)
          }
        } else if (entry.isFile()) {
          const ext = path.extname(entry.name)
          if (extensions.includes(ext)) {
            try {
              const content = fs.readFileSync(fullPath, 'utf-8')
              // Chercher les appels de getUserInfo ou getAuthorization
              if (
                content.includes('getUserInfo(') ||
                content.includes('getAuthorization(')
              ) {
                files.push(fullPath)
              }
            } catch (_) {
              // Ignorer les fichiers inaccessibles
            }
          }
        }
      }
    } catch (error) {
      // Ignorer les dossiers inaccessibles
    }
  }

  walk(rootPath)
  return files
}

// ============================================================================
// CORRECTION DES FICHIERS
// ============================================================================

function extractAuthParams(content: string): { role?: string | string[]; function?: string | string[] } {
  const result: { role?: string | string[]; function?: string | string[] } = {}

  // Pattern: getAuthorization(user, 'ROLE')
  const singleRolePattern = /getAuthorization\s*\(\s*user\s*,\s*['"]([^'"]+)['"]\s*\)/
  const match1 = content.match(singleRolePattern)
  if (match1) {
    result.role = match1[1]
    return result
  }

  // Pattern: getAuthorization(user, ['ROLE1', 'ROLE2'])
  const multiRolePattern = /getAuthorization\s*\(\s*user\s*,\s*\[([^\]]+)\]\s*\)/
  const match2 = content.match(multiRolePattern)
  if (match2) {
    const roles = match2[1].split(',').map(r => r.trim().replace(/['"]/g, ''))
    result.role = roles
    return result
  }

  // Pattern: getAuthorization(user, 'ROLE', 'FUNCTION')
  const roleAndFuncPattern = /getAuthorization\s*\(\s*user\s*,\s*['"]([^'"]+)['"]\s*,\s*['"]([^'"]+)['"]\s*\)/
  const match3 = content.match(roleAndFuncPattern)
  if (match3) {
    result.role = match3[1]
    result.function = match3[2]
    return result
  }

  // Pattern: getAuthorization(user, { role: 'ROLE', function: 'FUNCTION' })
  const objectPattern = /getAuthorization\s*\(\s*user\s*,\s*{\s*role\s*:\s*['"]([^'"]+)['"]\s*,\s*function\s*:\s*['"]([^'"]+)['"]\s*}\s*\)/
  const match4 = content.match(objectPattern)
  if (match4) {
    result.role = match4[1]
    result.function = match4[2]
    return result
  }

  return result
}

function fixFile(filePath: string, dryRun: boolean): { fixed: boolean; changes: string[]; error?: string } {
  const content = fs.readFileSync(filePath, 'utf-8')
  let newContent = content
  const changes: string[] = []
  let fixed = false

  const hasGetUserInfo = content.includes('getUserInfo(')
  const hasGetAuthorization = content.includes('getAuthorization(')

  // 1. Supprimer l'import de getUserInfo
  if (hasGetUserInfo) {
    newContent = newContent.replace(
      /import\s*{\s*getUserInfo\s*}\s*from\s*['"][^'"]+['"]\s*\n?/g,
      ''
    )
    changes.push('Suppression de l\'import getUserInfo')
    fixed = true
  }

  // 2. Supprimer l'import de getAuthorization
  if (hasGetAuthorization) {
    newContent = newContent.replace(
      /import\s*{\s*getAuthorization\s*}\s*from\s*['"][^'"]+['"]\s*\n?/g,
      ''
    )
    changes.push('Suppression de l\'import getAuthorization')
    fixed = true
  }

  // 3. Ajouter l'import de authAccess si nécessaire
  if (!content.includes('import { authAccess } from')) {
    // Trouver le premier import
    const importRegex = /^import\s+.*\n/m
    const firstImport = newContent.match(importRegex)
    if (firstImport) {
      const insertPosition = newContent.indexOf(firstImport[0]) + firstImport[0].length
      const newImport = "import { authAccess } from '@/services/auth'\n"
      newContent = newContent.slice(0, insertPosition) + newImport + newContent.slice(insertPosition)
      changes.push('Ajout de l\'import authAccess')
      fixed = true
    }
  }

  // 4. Remplacer getUserInfo par authAccess
  if (hasGetUserInfo) {
    // Remplacer const user = await getUserInfo()
    newContent = newContent.replace(
      /const\s+user\s*=\s*await\s+getUserInfo\s*\(\s*\)\s*\n?/g,
      ''
    )
    // Remplacer const user = await getUserInfo({ cache: false })
    newContent = newContent.replace(
      /const\s+user\s*=\s*await\s+getUserInfo\s*\(\s*{\s*cache\s*:\s*false\s*}\s*\)\s*\n?/g,
      ''
    )
    changes.push('Migration de getUserInfo vers authAccess')
    fixed = true
  }

  // 5. Remplacer getAuthorization par authAccess
  if (hasGetAuthorization) {
    const params = extractAuthParams(content)
    if (Object.keys(params).length > 0) {
      const authCall = generateAuthCall(params)
      
      // Remplacer const auth = getAuthorization(...)
      newContent = newContent.replace(
        /const\s+auth\s*=\s*getAuthorization\s*\([^)]+\)/g,
        authCall
      )
      changes.push('Migration de getAuthorization vers authAccess')
      fixed = true
    }
  }

  // 6. Remplacer les vérifications
  // if (!user) return { error: ERRORS.AUTH.UNAUTHORIZED }
  newContent = newContent.replace(
    /if\s*\(\s*!\s*user\s*\)\s*{\s*return\s*{\s*error\s*:\s*ERRORS\.AUTH\.UNAUTHORIZED\s*}\s*}/g,
    'if (!auth.data) return { error: auth.error }'
  )

  // if (!user) return { error: ERRORS.AUTH.UNAUTHORIZED } (sans accolades)
  newContent = newContent.replace(
    /if\s*\(\s*!\s*user\s*\)\s*return\s*{\s*error\s*:\s*ERRORS\.AUTH\.UNAUTHORIZED\s*}/g,
    'if (!auth.data) return { error: auth.error }'
  )

  // if (!user) { return { error: ERRORS.AUTH.UNAUTHORIZED } }
  newContent = newContent.replace(
    /if\s*\(\s*!\s*user\s*\)\s*{\s*return\s*{\s*error\s*:\s*ERRORS\.AUTH\.UNAUTHORIZED\s*}\s*}/g,
    'if (!auth.data) return { error: auth.error }'
  )

  // if (!user) return { error: ERRORS.ORG.NOT_FOUND }
  newContent = newContent.replace(
    /if\s*\(\s*!\s*user\s*\)\s*return\s*{\s*error\s*:\s*ERRORS\.ORG\.NOT_FOUND\s*}/g,
    'if (!auth.data) return { error: auth.error }'
  )

  // if (!user) { return { error: ERRORS.ORG.NOT_FOUND } }
  newContent = newContent.replace(
    /if\s*\(\s*!\s*user\s*\)\s*{\s*return\s*{\s*error\s*:\s*ERRORS\.ORG\.NOT_FOUND\s*}\s*}/g,
    'if (!auth.data) return { error: auth.error }'
  )

  // user?.id → auth.data?.user?.id
  newContent = newContent.replace(
    /user\?\.id/g,
    'auth.data?.user?.id'
  )

  // user.organization?.id → auth.data?.orgId
  newContent = newContent.replace(
    /user\.organization\?\.id/g,
    'auth.data?.orgId'
  )

  // user.organization.id → auth.data?.orgId
  newContent = newContent.replace(
    /user\.organization\.id/g,
    'auth.data?.orgId'
  )

  // user.id → auth.data?.user?.id
  newContent = newContent.replace(
    /user\.id/g,
    'auth.data?.user?.id'
  )

  // user.email → auth.data?.user?.email
  newContent = newContent.replace(
    /user\.email/g,
    'auth.data?.user?.email'
  )

  // user.name → auth.data?.user?.name
  newContent = newContent.replace(
    /user\.name/g,
    'auth.data?.user?.name'
  )

  // const orgId = user.organization?.id → const orgId = auth.data?.orgId
  newContent = newContent.replace(
    /const\s+orgId\s*=\s*user\.organization\?\.id/g,
    'const orgId = auth.data?.orgId'
  )

  // const orgId = user.organization.id → const orgId = auth.data?.orgId
  newContent = newContent.replace(
    /const\s+orgId\s*=\s*user\.organization\.id/g,
    'const orgId = auth.data?.orgId'
  )

  // 7. Nettoyer les imports en double
  const authAccessImports = newContent.match(/import\s*{\s*authAccess\s*}\s*from\s*['"][^'"]+['"]/g)
  if (authAccessImports && authAccessImports.length > 1) {
    const first = authAccessImports[0]
    const rest = authAccessImports.slice(1)
    for (const r of rest) {
      newContent = newContent.replace(r, '')
    }
    changes.push('Nettoyage des imports en double')
    fixed = true
  }

  // 8. Nettoyer les lignes vides en trop
  newContent = newContent.replace(/\n{3,}/g, '\n\n')

  if (fixed && !dryRun) {
    fs.writeFileSync(filePath, newContent, 'utf-8')
  }

  return { fixed, changes }
}

function generateAuthCall(params: { role?: string | string[]; function?: string | string[] }): string {
  const parts: string[] = []
  
  if (params.role) {
    if (Array.isArray(params.role)) {
      parts.push(`requiredRole: [${params.role.map(r => `'${r}'`).join(', ')}]`)
    } else {
      parts.push(`requiredRole: '${params.role}'`)
    }
  }
  
  if (params.function) {
    if (Array.isArray(params.function)) {
      parts.push(`requiredFunction: [${params.function.map(f => `'${f}'`).join(', ')}]`)
    } else {
      parts.push(`requiredFunction: '${params.function}'`)
    }
  }
  
  return `const auth = await authAccess({ ${parts.join(', ')} })`
}

// ============================================================================
// EXÉCUTION PRINCIPALE
// ============================================================================

function main() {
  console.log('')
  log('cyan', '========================================')
  log('cyan', 'MIGRATION VERS authAccess')
  log('cyan', '========================================')
  log('cyan', '  Ancienne: getUserInfo() + getAuthorization()')
  log('cyan', '  Nouvelle: authAccess({ requiredRole, requiredFunction })')
  console.log('')

  if (DRY_RUN) {
    log('yellow', '🔍 MODE SIMULATION - Analyse seulement, aucun fichier ne sera modifié')
  } else if (FIX) {
    log('green', '🔧 MODE CORRECTION - Les fichiers seront modifiés')
  } else {
    log('yellow', '📊 MODE ANALYSE - Affiche les fichiers à corriger sans les modifier')
    log('yellow', '   Utilisez --fix pour corriger automatiquement')
  }
  console.log('')

  try {
    const projectRoot = getProjectRoot()
    log('cyan', `📁 Racine du projet : ${projectRoot}`)
    console.log('')

    process.chdir(projectRoot)

    const servicesPath = path.join(projectRoot, 'src', 'services')
    if (!fs.existsSync(servicesPath)) {
      log('red', `❌ Dossier src/services introuvable : ${servicesPath}`)
      return
    }

    log('cyan', '📂 Recherche des fichiers à migrer dans src/services...')
    const files = findFiles(servicesPath)

    if (files.length === 0) {
      log('green', '✅ Aucun fichier à migrer !')
      return
    }

    log('cyan', `✅ Trouvé ${files.length} fichier(s) à analyser`)
    console.log('')

    const analyses: FileAnalysis[] = []
    for (const file of files) {
      const analysis = analyzeFile(file)
      if (analysis.needsFix) {
        analyses.push(analysis)
      }
    }

    // Générer le rapport
    console.log('')
    log('cyan', '========================================')
    log('cyan', 'RAPPORT D\'ANALYSE')
    log('cyan', '========================================')
    console.log('')

    log('yellow', `📊 Fichiers analysés : ${files.length}`)
    log('red', `⚠️  Fichiers à corriger : ${analyses.length}`)
    log('green', `✅ Fichiers déjà corrigés : ${files.length - analyses.length}`)

    if (analyses.length > 0) {
      console.log('')
      log('yellow', '📝 Fichiers à corriger :')
      for (const analysis of analyses) {
        const relativePath = path.relative(process.cwd(), analysis.path)
        log('magenta', `  - ${relativePath}`)
        if (analysis.hasGetUserInfo) {
          console.log(`      getUserInfo: ✅`)
        }
        if (analysis.hasGetAuthorization) {
          console.log(`      getAuthorization: ✅`)
        }
      }
    }

    if (FIX && analyses.length > 0) {
      console.log('')
      log('cyan', '========================================')
      log('cyan', 'CORRECTION DES FICHIERS')
      log('cyan', '========================================')
      console.log('')

      let fixedCount = 0
      let failedCount = 0

      for (const analysis of analyses) {
        const relativePath = path.relative(process.cwd(), analysis.path)
        log('magenta', `  ✏️  ${relativePath}`)
        const result = fixFile(analysis.path, DRY_RUN)
        if (result.fixed) {
          fixedCount++
          for (const change of result.changes) {
            console.log(`      - ${change}`)
          }
        } else if (result.error) {
          failedCount++
          log('red', `      ❌ ${result.error}`)
        }
      }

      console.log('')
      log('cyan', '========================================')
      log('cyan', 'RÉSULTAT')
      log('cyan', '========================================')
      if (DRY_RUN) {
        log('yellow', '🔍 Simulation terminée !')
        log('cyan', `   Fichiers à corriger : ${fixedCount}`)
        console.log('')
        log('cyan', '   Pour appliquer les changements, exécutez :')
        log('cyan', '   npx tsx scripts/fix-authAccess-imports.ts --fix')
      } else {
        log('green', `✅ ${fixedCount} fichier(s) corrigé(s) avec succès !`)
        if (failedCount > 0) {
          log('red', `❌ ${failedCount} fichier(s) en échec`)
        }
        log('yellow', '⚠️  Vérifiez manuellement les fichiers modifiés')
        console.log('')
        log('cyan', '   Pour voir les modifications :')
        log('cyan', '   git diff')
      }
    } else if (analyses.length > 0) {
      console.log('')
      log('yellow', '💡 Pour corriger automatiquement ces fichiers, exécutez :')
      log('cyan', '   npx tsx scripts/fix-authAccess-imports.ts --fix')
    }

    console.log('')
  } catch (error) {
    log('red', `❌ Erreur : ${error instanceof Error ? error.message : String(error)}`)
    process.exit(1)
  }
}

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

main()
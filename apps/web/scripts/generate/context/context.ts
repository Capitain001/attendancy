import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const servicesDir = path.join(__dirname, '../../../src/services')

// Generic roles mapping
function getGenericRole(filePath: string): string {
  if (filePath === 'actions/index.ts') return 'Barrel exports des actions'
  if (filePath === 'database/index.ts') return 'Barrel interne (non exporté)'
  if (filePath === 'index.ts') return 'Point d\'entrée du service (export actions + types)'
  if (filePath === 'cache.ts') return '<SERVICE>_GRAPH : événement → tags à invalider'
  if (filePath === 'constants.ts') return 'Constantes du domaine'
  if (filePath === 'types.ts') return 'DTOs et types du domaine'
  if (filePath === 'generated.types.ts') return 'Types générés automatiquement (DTOs de lecture)'
  if (filePath === 'validation.ts') return 'Schémas Valibot'
  if (filePath.endsWith('.queries.ts')) {
    if (filePath.startsWith('actions/')) return 'Lectures serveur exposées au frontend'
    if (filePath.startsWith('database/')) return 'Requêtes Prisma (lectures avec cache)'
  }
  if (filePath.endsWith('.mutations.ts')) {
    if (filePath.startsWith('actions/')) return 'Écritures serveur (Validation + AuthGuard)'
    if (filePath.startsWith('database/')) return 'Requêtes Prisma (tryConstraint + invalidateEvent)'
  }
  if (filePath.endsWith('.analytics.ts')) return 'Fonctions liées aux statistiques'
  if (filePath === 'policy.ts') return 'Règles d\'autorisation métier'
  if (filePath === 'utils.ts') return 'Utilitaires internes'
  
  return 'Fichier interne'
}

function updateClaudeMd() {
  const services = fs.readdirSync(servicesDir).filter(dir => {
    const p = path.join(servicesDir, dir)
    return fs.statSync(p).isDirectory() && fs.existsSync(path.join(p, 'CLAUDE.md'))
  })
  
  let updatedCount = 0

  for (const service of services) {
    const claudePath = path.join(servicesDir, service, 'CLAUDE.md')
    const content = fs.readFileSync(claudePath, 'utf-8')
    
    // Find files in service
    const actualFiles: string[] = []
    function walk(dir: string, base: string = '') {
      if (!fs.existsSync(dir)) return
      for (const item of fs.readdirSync(dir)) {
        if (item === '.api' || item === '__tests__' || item === 'CLAUDE.md') continue
        
        const fullPath = path.join(dir, item)
        const relPath = path.join(base, item).replace(/\\/g, '/')
        if (fs.statSync(fullPath).isDirectory()) {
          walk(fullPath, relPath)
        } else {
          if (item.endsWith('.ts')) actualFiles.push(relPath)
        }
      }
    }
    walk(path.join(servicesDir, service))
    actualFiles.sort() // Sort alphabetically

    // Parse old table
    const fileRoleMap = new Map<string, string>()
    const tableRegex = /\|\s*Fichier\s*\|\s*Rôle\s*\|\n\|\s*[-]+\s*\|\s*[-]+\s*\|\n([\s\S]*?)(?=\n##|\n$)/
    
    const match = content.match(tableRegex)
    if (match) {
      const rows = match[1].split('\n').filter(r => r.trim().startsWith('|'))
      for (const row of rows) {
        const parts = row.split('|')
        if (parts.length >= 3) {
          const fileRaw = parts[1].trim()
          const roleRaw = parts[2].trim()
          // fileRaw is often wrapped in backticks
          const fileClean = fileRaw.replace(/`/g, '')
          fileRoleMap.set(fileClean, roleRaw)
        }
      }
    }
    
    // Build new table
    let newTable = '| Fichier | Rôle |\n|---------|------|\n'
    for (const file of actualFiles) {
      const existingRole = fileRoleMap.get(file)
      const role = existingRole ? existingRole : getGenericRole(file)
      newTable += `| \`${file}\` | ${role} |\n`
    }
    
    // Replace in content
    let newContent = content
    if (match) {
       newContent = content.replace(match[0], newTable.trim())
    } else {
      // Find the ## Fichiers header to append
      const sectionHeader = '## Fichiers\n'
      if (content.includes(sectionHeader)) {
         newContent = content.replace(sectionHeader, sectionHeader + '\n' + newTable.trim() + '\n')
      } else {
         newContent += '\n## Fichiers\n\n' + newTable.trim() + '\n'
      }
    }
    
    if (newContent !== content) {
      fs.writeFileSync(claudePath, newContent)
      updatedCount++
      console.log(`✅ Mis à jour : ${service}/CLAUDE.md`)
    }
  }
  
  console.log(`\nTerminé ! ${updatedCount} fichiers CLAUDE.md mis à jour.`)
}

updateClaudeMd()

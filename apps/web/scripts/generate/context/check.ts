import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const servicesDir = path.join(__dirname, '../../../src/services')

function checkClaudeMdFiles() {
  const services = fs.readdirSync(servicesDir).filter(dir => {
    const p = path.join(servicesDir, dir)
    return fs.statSync(p).isDirectory() && fs.existsSync(path.join(p, 'CLAUDE.md'))
  })
  
  let issues = 0

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

    const missingInClaude: string[] = []
    for (const file of actualFiles) {
      if (!content.includes(file)) {
        missingInClaude.push(file)
      }
    }
    
    if (missingInClaude.length > 0) {
      console.log(`❌ [${service}] Fichiers non documentés dans CLAUDE.md :`)
      missingInClaude.forEach(f => console.log(`  - ${f}`))
      issues++
    }
  }
  
  if (issues > 0) {
    console.log(`\n❌ ${issues} fichier(s) CLAUDE.md obsolète(s). Lancez npm run generate:context (ou npx tsx scripts/generate/context/context.ts) pour les mettre à jour.`)
    process.exit(0)
  } else {
    console.log('✅ Tous les CLAUDE.md sont à jour.')
  }
}

checkClaudeMdFiles()

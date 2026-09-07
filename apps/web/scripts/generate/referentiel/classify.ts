#!/usr/bin/env tsx
// scripts/generate/referentiel/classify.ts
//
// Compare les dossiers de src/services/ aux modèles Prisma
// (prisma/schemas/*.prisma) pour proposer un classement MODEL vs DOMAIN.
// NON-BLOQUANT (exit 0) — affiche un rapport ; le développeur reporte
// manuellement tout écart dans src/services/referentiel.ts (source de
// vérité manuelle, jamais écrasée par ce script).
//
// Règle : dossier dont le kebab-case correspond EXACTEMENT au kebab-case
// d'un modèle Prisma → MODEL. Sinon → DOMAIN par défaut (aucun modèle
// propre trouvé = orchestrateur par construction).
//
// Limite assumée (script volontairement simple) : matching EXACT
// uniquement — pas de gestion pluriel/singulier ni de synonymes.
//
// Usage :
//   npx tsx scripts/generate/referentiel/classify.ts

import { readdirSync, readFileSync, statSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url))
const SERVICES_DIR = join(SCRIPT_DIR, '../../../src/services')
const PRISMA_SCHEMAS_DIR = join(SCRIPT_DIR, '../../../prisma/schemas')

function toKebabCase(pascalCase: string): string {
  return pascalCase
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1-$2')
    .toLowerCase()
}

function getPrismaModelKebabNames(): Set<string> {
  const files = readdirSync(PRISMA_SCHEMAS_DIR).filter((f) => f.endsWith('.prisma'))
  const modelNames = new Set<string>()

  for (const file of files) {
    const content = readFileSync(join(PRISMA_SCHEMAS_DIR, file), 'utf-8')
    for (const match of content.matchAll(/^\s*model\s+(\w+)\s*\{/gm)) {
      modelNames.add(toKebabCase(match[1]))
    }
  }

  return modelNames
}

function getServiceFolderNames(): string[] {
  return readdirSync(SERVICES_DIR)
    .filter((entry) => entry !== 'generated')
    .filter((entry) => statSync(join(SERVICES_DIR, entry)).isDirectory())
}

function classify() {
  const modelKebabNames = getPrismaModelKebabNames()
  const serviceFolders = getServiceFolderNames()

  const modelServices: string[] = []
  const domainServices: string[] = []

  for (const folder of serviceFolders) {
    if (modelKebabNames.has(folder)) {
      modelServices.push(folder)
    } else {
      domainServices.push(folder)
    }
  }

  console.log('\n=== Services MODÈLE (1 dossier ↔ 1 modèle Prisma) ===')
  modelServices.sort().forEach((s) => console.log(`  ✓ ${s}`))

  console.log('\n=== Services DOMAINE (aucun modèle correspondant — orchestrateur) ===')
  domainServices.sort().forEach((s) => console.log(`  ○ ${s}`))

  console.log(
    `\n${modelServices.length} service(s) modèle, ${domainServices.length} service(s) domaine — ${serviceFolders.length} dossier(s) au total.`,
  )
  console.log('\n⚠ Rapport uniquement — reporte manuellement tout écart dans src/services/referentiel.ts.\n')
}

classify()
#!/usr/bin/env tsx
// scripts/generate/referentiel/referentiel.ts
//
// Scanne src/services/* et prisma/schemas/*.prisma, écrit intégralement
// src/generated/referentiel.ts (classification MODEL/DOMAIN + path + alias
// de vérification compile-time). Comportement pleinement automatique — la
// classification en elle-même n'a pas de zone d'ambiguïté nécessitant un
// arbitrage humain (contrairement aux DTOs de types.ts où un nom peut déjà
// être pris manuellement) : un dossier a un modèle Prisma correspondant ou
// non, point final.
//
// Ce qui N'EST PAS généré ici — volontairement laissé à
// src/services/referentiel.ts (fichier manuel, jamais écrasé) :
//   - la description de ce qu'orchestre chaque service DOMAIN (sémantique,
//     non dérivable d'un nom de dossier) ;
//   - un override ponctuel si un dossier MODEL ne matche pas exactement le
//     kebab-case de son modèle (renommage).
//
// Usage :
//   npx tsx scripts/generate/referentiel/referentiel.ts

import { readdirSync, readFileSync, statSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { IGNORED_SERVICE_FOLDER_NAMES } from './config'

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url))
const SERVICES_DIR = join(SCRIPT_DIR, '../../../src/services')
const PRISMA_SCHEMAS_DIR = join(SCRIPT_DIR, '../../../prisma/schemas')
const OUTPUT_DIR = join(SCRIPT_DIR, '../../../src/generated')
const OUTPUT_PATH = join(OUTPUT_DIR, 'referentiel.ts')

function toKebabCase(pascalCase: string): string {
  return pascalCase
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1-$2')
    .toLowerCase()
}

function toPascalCase(kebabCase: string): string {
  return kebabCase
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('')
}

function getPrismaModels(): Map<string, string> {
  // clé = kebab-case du modèle, valeur = nom PascalCase original
  const files = readdirSync(PRISMA_SCHEMAS_DIR).filter((f) => f.endsWith('.prisma'))
  const models = new Map<string, string>()

  for (const file of files) {
    const content = readFileSync(join(PRISMA_SCHEMAS_DIR, file), 'utf-8')
    for (const match of content.matchAll(/^\s*model\s+(\w+)\s*\{/gm)) {
      models.set(toKebabCase(match[1]), match[1])
    }
  }

  return models
}

function getServiceFolderNames(): string[] {
  return readdirSync(SERVICES_DIR)
    .filter((entry) => statSync(join(SERVICES_DIR, entry)).isDirectory())
    .filter((entry) => !IGNORED_SERVICE_FOLDER_NAMES.has(entry)) // relais src/modules/ exclus
    .sort()
}
function generate() {
  const prismaModels = getPrismaModels()
  const folders = getServiceFolderNames()

  const modelEntries: string[] = []
  const domainEntries: string[] = []
  const aliasLines: string[] = []

  for (const folder of folders) {
    const aliasName = `${toPascalCase(folder)}ServiceIndex`
    aliasLines.push(`export type ${aliasName} = typeof import('../services/${folder}')`)

    const matchedModel = prismaModels.get(folder)
    if (matchedModel) {
      modelEntries.push(`  '${folder}': { model: '${matchedModel}', path: '../services/${folder}' },`)
    } else {
      domainEntries.push(`  '${folder}': { path: '../services/${folder}' },`)
    }
  }

  const content = `// src/generated/referentiel.ts
//
// ⚠ Fichier généré automatiquement — NE PAS ÉDITER À LA MAIN
// Régénérer via : npx tsx scripts/generate/referentiel/referentiel.ts
//
// Classification MODEL vs DOMAIN dérivée par comparaison exacte du
// kebab-case des dossiers de src/services/ avec le kebab-case des modèles
// Prisma (prisma/schemas/*.prisma). Dossier sans modèle correspondant →
// DOMAIN par défaut (orchestrateur par construction).
//
// Limite assumée : matching EXACT uniquement. Un dossier de service MODEL
// renommé pour ne plus matcher son modèle serait ici classé DOMAIN par
// erreur — c'est le seul cas nécessitant un override manuel, voir
// src/services/referentiel.ts.

export const ServiceType = {
  MODEL: 'MODEL',
  DOMAIN: 'DOMAIN',
} as const

export type ServiceType = (typeof ServiceType)[keyof typeof ServiceType]

export const MODEL_SERVICES = {
${modelEntries.join('\n')}
} satisfies Record<string, { model: string; path: string }>

export const DOMAIN_SERVICES = {
${domainEntries.join('\n')}
} satisfies Record<string, { path: string }>

export type ModelServiceName = keyof typeof MODEL_SERVICES
export type DomainServiceName = keyof typeof DOMAIN_SERVICES

export function getServiceType(folderName: string): ServiceType | null {
  if (folderName in MODEL_SERVICES) return ServiceType.MODEL
  if (folderName in DOMAIN_SERVICES) return ServiceType.DOMAIN
  return null
}

// ─── Vérification compile-time des chemins ──────────────────────────────
// Alias jamais utilisés comme valeurs — forcent TypeScript à résoudre
// chaque index au moment de la compilation. Exportés (pas de warning
// ts(6196) "declared but never used").
${aliasLines.join('\n')}
`

  mkdirSync(OUTPUT_DIR, { recursive: true })
  writeFileSync(OUTPUT_PATH, content)
  console.log(`✓ ${modelEntries.length} service(s) modèle, ${domainEntries.length} service(s) domaine → ${OUTPUT_PATH}`)
}

generate()
/**
 * scripts/test/prisma-error-meta.ts
 *
 * Capture la forme exacte de error.meta pour P2002 et P2003 en Prisma 7.
 * Objectif : valider que les clés de CONSTRAINT_ERROR correspondent à ce que
 * Prisma retourne réellement dans error.meta.target / error.meta.constraint.
 *
 * Usage : npx tsx scripts/test/prisma-error-meta.ts
 */

import { PrismaClient } from '@/generated/prisma/client'
import { PrismaPg }     from '@prisma/adapter-pg'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma  = new PrismaClient({ adapter })

// ── Utilitaires ───────────────────────────────────────────────────────────────

function section(title: string) {
  console.log('\n' + '═'.repeat(60))
  console.log(`  ${title}`)
  console.log('═'.repeat(60))
}

function dump(label: string, value: unknown) {
  console.log(`\n[${label}]`)
  console.dir(value, { depth: null })
}

// ── P2002 — Violation de contrainte unique ────────────────────────────────────

async function testP2002_singleField() {
  section('P2002 — Contrainte unique mono-champ (Organization.name)')

  const name = `__test_p2002_${Date.now()}`

  try {
    // Création initiale
    const org = await prisma.organization.create({ data: { name } })

    try {
      // Doublon intentionnel → P2002
      await prisma.organization.create({ data: { name } })
      console.log('⚠ Aucune erreur levée — inattendu')
    } catch (err: unknown) {
      dump('error instanceof', (err as any)?.constructor?.name)
      dump('error.code',       (err as any)?.code)
      dump('error.meta',       (err as any)?.meta)
      dump('error.message (extrait)', (err as any)?.message?.slice(0, 300))
    } finally {
      await prisma.organization.delete({ where: { id: org.id } })
    }
  } catch (err) {
    console.error('Échec setup P2002 mono-champ:', err)
  }
}

async function testP2002_compositeField() {
  section('P2002 — Contrainte unique composite (AcademicYear.[name, orgId])')

  const orgName  = `__test_org_${Date.now()}`
  const yearName = `__test_year_${Date.now()}`

  let orgId: string | undefined

  try {
    const org = await prisma.organization.create({ data: { name: orgName } })
    orgId = org.id

    const startDate = new Date('2024-09-01')
    const endDate   = new Date('2025-06-30')

    // Création initiale
    await prisma.academicYear.create({
      data: { name: yearName, startDate, endDate, orgId },
    })

    try {
      // Doublon intentionnel → P2002
      await prisma.academicYear.create({
        data: { name: yearName, startDate, endDate, orgId },
      })
      console.log('⚠ Aucune erreur levée — inattendu')
    } catch (err: unknown) {
      dump('error instanceof', (err as any)?.constructor?.name)
      dump('error.code',       (err as any)?.code)
      dump('error.meta',       (err as any)?.meta)
      dump('typeof meta.target', typeof (err as any)?.meta?.target)
      dump('Array.isArray(meta.target)', Array.isArray((err as any)?.meta?.target))
      dump('error.message (extrait)', (err as any)?.message?.slice(0, 300))
    }
  } catch (err) {
    console.error('Échec setup P2002 composite:', err)
  } finally {
    if (orgId) {
      await prisma.academicYear.deleteMany({ where: { orgId } })
      await prisma.organization.delete({ where: { id: orgId } })
    }
  }
}

// ── P2003 — Violation de clé étrangère ───────────────────────────────────────

async function testP2003() {
  section('P2003 — Violation FK (AcademicYear.orgId inexistant)')

  const fakeOrgId = '00000000-0000-0000-0000-000000000001'

  try {
    await prisma.academicYear.create({
      data: {
        name:      `__test_fk_${Date.now()}`,
        startDate: new Date('2024-09-01'),
        endDate:   new Date('2025-06-30'),
        orgId:     fakeOrgId,
      },
    })
    console.log('⚠ Aucune erreur levée — inattendu')
  } catch (err: unknown) {
    dump('error instanceof', (err as any)?.constructor?.name)
    dump('error.code',       (err as any)?.code)
    dump('error.meta',       (err as any)?.meta)
    dump('error.message (extrait)', (err as any)?.message?.slice(0, 300))
  }
}

// ── P2025 — Enregistrement introuvable ───────────────────────────────────────

async function testP2025() {
  section('P2025 — Enregistrement introuvable (delete inexistant)')

  try {
    await prisma.organization.delete({
      where: { id: '00000000-0000-0000-0000-000000000001' },
    })
    console.log('⚠ Aucune erreur levée — inattendu')
  } catch (err: unknown) {
    dump('error instanceof', (err as any)?.constructor?.name)
    dump('error.code',       (err as any)?.code)
    dump('error.meta',       (err as any)?.meta)
    dump('error.message (extrait)', (err as any)?.message?.slice(0, 300))
  }
}

// ── Vérification normalizeConstraintTarget ────────────────────────────────────

async function testNormalize() {
  section('normalizeConstraintTarget — comparaison V1 vs V2')

  const cases: Array<{ input: string[]; expected_v1: string; expected_v2: string }> = [
    {
      input:       ['name', 'orgId'],
      expected_v1: ['name', 'orgId'].sort((a, b) => a.localeCompare(b)).join(','),
      expected_v2: ['name', 'orgId'].sort().join(','),
    },
    {
      input:       ['orgId', 'name'],
      expected_v1: ['orgId', 'name'].sort((a, b) => a.localeCompare(b)).join(','),
      expected_v2: ['orgId', 'name'].sort().join(','),
    },
    {
      input:       ['AcademicYear_name_orgId_key'],
      expected_v1: 'AcademicYear_name_orgId_key',
      expected_v2: 'AcademicYear_name_orgId_key',
    },
  ]

  for (const c of cases) {
    const same = c.expected_v1 === c.expected_v2
    console.log(`\nInput: ${JSON.stringify(c.input)}`)
    console.log(`  V1 (localeCompare): "${c.expected_v1}"`)
    console.log(`  V2 (default sort) : "${c.expected_v2}"`)
    console.log(`  Identiques        : ${same ? '✅' : '⚠ DIFFÉRENCE'}`)
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🔍 Capture error.meta Prisma 7')
  console.log(`   DATABASE_URL: ${process.env.DATABASE_URL ? '✓ définie' : '✗ manquante'}`)

  try {
    await testP2002_singleField()
    await testP2002_compositeField()
    await testP2003()
    await testP2025()
    await testNormalize()
  } finally {
    await prisma.$disconnect()
  }
}

main().catch((e) => {
  console.error('Erreur fatale:', e)
  process.exit(1)
})

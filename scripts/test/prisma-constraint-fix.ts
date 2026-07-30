/**
 * scripts/test/prisma-constraint-fix.ts
 * Valide que tryConstraint / uniqueError retournent le bon message après le fix Prisma 7.
 * Usage : npx tsx scripts/test/prisma-constraint-fix.ts
 */

import { PrismaClient } from '@/generated/prisma/client'
import { PrismaPg }     from '@prisma/adapter-pg'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma  = new PrismaClient({ adapter })

// Import du module fixé
import { tryConstraint, uniqueError, normalizeConstraintTarget } from '@/utils/server/prisma'

let pass = 0
let fail = 0

function check(label: string, actual: string, expected: string) {
  if (actual === expected) {
    console.log(`  ✅ ${label}`)
    pass++
  } else {
    console.log(`  ❌ ${label}`)
    console.log(`     attendu  : "${expected}"`)
    console.log(`     obtenu   : "${actual}"`)
    fail++
  }
}

// ── Test 1 : P2002 mono-champ — doit retourner CONSTRAINT_ERROR ou UNIQUE.DEFAULT ──

async function testP2002Single() {
  console.log('\n── P2002 mono-champ (Organization.name) ─────────────────────')
  const name   = `__fix_test_${Date.now()}`
  let   orgId: string | undefined

  try {
    const org = await prisma.organization.create({ data: { name } })
    orgId = org.id

    try {
      await tryConstraint(prisma.organization.create({ data: { name } }))
      console.log('  ❌ Aucune erreur levée — inattendu')
      fail++
    } catch (e: any) {
      // Organization.name a @unique → 'Organization_name_key' — absent de CONSTRAINT_ERROR
      // → doit tomber sur UNIQUE.DEFAULT
      check('P2002 mono → UNIQUE.DEFAULT', e.message, 'Cette valeur existe déjà')
    }
  } finally {
    if (orgId) await prisma.organization.delete({ where: { id: orgId } })
  }
}

// ── Test 2 : P2002 composite (AcademicYear.[name, orgId]) ──────────────────────

async function testP2002Composite() {
  console.log('\n── P2002 composite (AcademicYear_name_orgId_key) ─────────────')
  const orgName  = `__fix_org_${Date.now()}`
  const yearName = `__fix_year_${Date.now()}`
  let   orgId: string | undefined

  try {
    const org = await prisma.organization.create({ data: { name: orgName } })
    orgId = org.id

    const data = {
      name:      yearName,
      startDate: new Date('2024-09-01'),
      endDate:   new Date('2025-06-30'),
      orgId,
    }

    await prisma.academicYear.create({ data })

    try {
      await tryConstraint(prisma.academicYear.create({ data }))
      console.log('  ❌ Aucune erreur levée — inattendu')
      fail++
    } catch (e: any) {
      // 'AcademicYear_name_orgId_key' est dans CONSTRAINT_ERROR
      check(
        'P2002 composite → message métier CONSTRAINT_ERROR',
        e.message,
        'Une année avec ce nom existe déjà',
      )
    }
  } finally {
    if (orgId) {
      await prisma.academicYear.deleteMany({ where: { orgId } })
      await prisma.organization.delete({ where: { id: orgId } })
    }
  }
}

// ── Test 3 : P2003 → FOREIGN_KEY ──────────────────────────────────────────────

async function testP2003() {
  console.log('\n── P2003 FK violation (AcademicYear.orgId inexistant) ────────')
  try {
    await tryConstraint(
      prisma.academicYear.create({
        data: {
          name:      `__fk_${Date.now()}`,
          startDate: new Date('2024-09-01'),
          endDate:   new Date('2025-06-30'),
          orgId:     '00000000-0000-0000-0000-000000000001',
        },
      }),
    )
    console.log('  ❌ Aucune erreur levée — inattendu')
    fail++
  } catch (e: any) {
    check('P2003 → FOREIGN_KEY fallback', e.message, 'Référence invalide')
  }
}

// ── Test 4 : P2025 → NOT_FOUND ────────────────────────────────────────────────

async function testP2025() {
  console.log('\n── P2025 (delete inexistant) ─────────────────────────────────')
  try {
    await tryConstraint(
      prisma.organization.delete({
        where: { id: '00000000-0000-0000-0000-000000000001' },
      }),
    )
    console.log('  ❌ Aucune erreur levée — inattendu')
    fail++
  } catch (e: any) {
    check('P2025 → NOT_FOUND', e.message, 'Enregistrement introuvable')
  }
}

// ── Test 5 : normalizeConstraintTarget ────────────────────────────────────────

function testNormalize() {
  console.log('\n── normalizeConstraintTarget ─────────────────────────────────')
  check('undefined → ""', normalizeConstraintTarget(undefined), '')
  check('[] → ""',        normalizeConstraintTarget([]), '')
  check('["name","orgId"] sorted → "name,orgId"', normalizeConstraintTarget(['name', 'orgId']), 'name,orgId')
  check('["orgId","name"] → sorted "name,orgId"', normalizeConstraintTarget(['orgId', 'name']), 'name,orgId')
  check('["AcademicYear_name_orgId_key"] → same', normalizeConstraintTarget(['AcademicYear_name_orgId_key']), 'AcademicYear_name_orgId_key')
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🔍 Validation fix Prisma 7 — tryConstraint / uniqueError')
  console.log(`   DATABASE_URL: ${process.env.DATABASE_URL ? '✓ définie' : '✗ manquante'}`)

  try {
    testNormalize()
    await testP2002Single()
    await testP2002Composite()
    await testP2003()
    await testP2025()
  } finally {
    await prisma.$disconnect()
  }

  console.log(`\n${'─'.repeat(50)}`)
  console.log(`Résultat : ${pass} ✅  ${fail} ❌`)
  if (fail > 0) process.exit(1)
}

main().catch((e) => {
  console.error('Erreur fatale:', e)
  process.exit(1)
})

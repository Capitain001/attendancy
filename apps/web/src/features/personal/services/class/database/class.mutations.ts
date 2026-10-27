// apps\web\src\features\personal\services\class\database\class.mutations.ts
import { prisma } from '@/lib/prisma'
import { tryConstraint } from '@/utils/server/prisma'
import { invalidateEvent } from '@/cache/server/graph'
import type { Prisma } from '@/generated/prisma/client'
import { PERSONAL } from '@/features/personal/constants'
import type { CreatePersonalClassOutput, UpdatePersonalClassDataOutput } from '../validation'

type Tx = Prisma.TransactionClient

// AcademicYear → Department → ProgramTrack → Class.
// Les trois upserts sont idempotents ; `class.create` ne l'est PAS.
async function insertPersonalClass(tx: Tx, { orgId, name, type }: CreatePersonalClassOutput & { orgId: string }) {
  const academicYear = await tx.academicYear.upsert({
    where: { name_orgId: { name: PERSONAL.NAME, orgId } },
    create: { ...PERSONAL.ACADEMIC_YEAR, name: PERSONAL.NAME, orgId },
    update: { isActive: true, isCurrent: true },
    select: { id: true },
  })

  const department = await tx.department.upsert({
    where: { name_orgId: { name: PERSONAL.NAME, orgId } },
    create: { name: PERSONAL.NAME, orgId },
    update: {},
    select: { id: true },
  })

  const programTrack = await tx.programTrack.upsert({
    where: { name_departmentId: { name: PERSONAL.NAME, departmentId: department.id } },
    create: { name: PERSONAL.NAME, departmentId: department.id, orgId },
    update: {},
    select: { id: true },
  })

  return tx.class.create({
    data: { name, type, level: 'L1', programTrackId: programTrack.id, academicYearId: academicYear.id },
    select: { id: true },
  })
}

// À appeler APRÈS le commit lorsque createPersonalClass a reçu un `tx`.
export function invalidatePersonalClassEvents(orgId: string) {
  return Promise.all([
    invalidateEvent('ACADEMIC_YEAR_CREATED', orgId),
    invalidateEvent('CLASS_CREATED', orgId),
    invalidateEvent('PROGRAM_TRACK_CREATED', orgId),
    invalidateEvent('DEPARTMENT_CREATED', orgId),
  ])
}

/**
 * Avec `tx` : s'exécute dans la transaction de l'appelant, SANS tryConstraint ni
 * invalidation (ils appartiennent à l'appelant, une fois la transaction commitée).
 * Sans `tx` : ouvre sa propre transaction, mappe les erreurs et invalide.
 */
export async function createPersonalClass(params: CreatePersonalClassOutput & { orgId: string }, tx?: Tx) {
  if (tx) return insertPersonalClass(tx, params)

  const result = await tryConstraint(prisma.$transaction((tx_) => insertPersonalClass(tx_, params)))
  await invalidatePersonalClassEvents(params.orgId)
  return result
}

export async function updatePersonalClass(classId: string, orgId: string, data: UpdatePersonalClassDataOutput) {
  const result = await tryConstraint(
    prisma.class.update({
      where: { id: classId, programTrack: { orgId } },
      data,
      select: { id: true },
    }),
  )

  await invalidateEvent('CLASS_UPDATED', orgId, classId)
  return result
}
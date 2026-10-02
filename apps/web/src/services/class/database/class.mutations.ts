// src/services/class/database/class.mutations.ts
import { prisma } from '@/lib/prisma'
import { tryConstraint } from '@/utils/server/prisma'
import { invalidateEvent } from '@/cache/server/graph'
import { getCurrentYear } from '@/services/academic-year/database'
import { PERSONAL_ACADEMIC_YEAR, PERSONAL_LABEL } from '../constants'
import type { CreateClassOutput, CreatePersonalClassOutput, UpdateClassDataOutput, UpdateClassOutput } from '../validation'


export async function createClass(data: CreateClassOutput & { orgId: string }) {
  const track = await prisma.programTrack.findFirst({
    where: { id: data.programTrackId, orgId: data.orgId },
    select: { id: true },
  })
  if (!track) throw new Error('Filière introuvable')

  const yearId = data.academicYearId ?? (await getCurrentYear(data.orgId))?.id
  if (!yearId) throw new Error('Aucune année académique courante — créer une année d\'abord')

  const result = await tryConstraint(prisma.class.create({
    data: {
      name:           data.name,
      level:          data.level ,
      programTrackId: data.programTrackId,
      academicYearId: yearId,
    },
    select: {
      id: true, name: true, level: true,
      programTrackId: true, academicYearId: true,
    },
  }))
  await invalidateEvent('CLASS_CREATED', data.orgId)
  return result
}


export async function updateClass(classId: string, orgId: string, data: UpdateClassDataOutput) {
  const updated = await tryConstraint(prisma.class.update({
    where: {
      id: classId,
      programTrack: { orgId },
    },
    data,
    select: {
      id: true,
      name: true,
      level: true,
      programTrackId: true,
      academicYearId: true,
    },
  }))
 
  await invalidateEvent('CLASS_UPDATED', orgId, classId)
  return updated
}
 


export async function removeClass(classId: string, orgId: string) {
  const result = await tryConstraint(prisma.class.update({
    // deletedAt: null -> une classe déjà archivée n'est pas ré-archivée (date conservée)
    where: { id: classId, deletedAt: null, programTrack: { orgId } },
    data: { deletedAt: new Date() },
    select: { id: true },
  }))
  await invalidateEvent('CLASS_REMOVED', orgId, classId)
  return result
}


export async function createPersonalClass(params: CreatePersonalClassOutput & { orgId: string }) {
  const { orgId, name } = params

  const result = await tryConstraint(
    prisma.$transaction(async (tx) => {
      const academicYear = await tx.academicYear.upsert({
        where: { name_orgId: { name: PERSONAL_LABEL, orgId } },
        create: { ...PERSONAL_ACADEMIC_YEAR, orgId },
        update: { isActive: true, isCurrent: true },
        select: { id: true },
      })

      const department = await tx.department.upsert({
        where: { name_orgId: { name: PERSONAL_LABEL, orgId } },
        create: { name: PERSONAL_LABEL, orgId },
        update: {},
        select: { id: true },
      })

      const programTrack = await tx.programTrack.upsert({
        where: { name_departmentId: { name: PERSONAL_LABEL, departmentId: department.id } },
        create: { name: PERSONAL_LABEL, departmentId: department.id, orgId },
        update: {},
        select: { id: true },
      })

      return tx.class.create({
        data: {
          name,
          level: 'L1',
          programTrackId: programTrack.id,
          academicYearId: academicYear.id,
        },
        select: { id: true, name: true },
      })
    }),
  )

  await Promise.all([
    invalidateEvent('ACADEMIC_YEAR_CREATED', orgId),
    invalidateEvent('CLASS_CREATED', orgId),
    invalidateEvent('PROGRAM_TRACK_CREATED', orgId),
    invalidateEvent('DEPARTMENT_CREATED', orgId),
  ])
  return result
}



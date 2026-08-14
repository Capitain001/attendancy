// src/services/class/database/class.mutations.ts
import { prisma } from '@/lib/prisma'
import { tryConstraint } from '@/utils/server/prisma'
import { invalidateEvent } from '@/cache/server/key'
import { getCurrentYear } from '@/services/academic-year/database'
import type { CreateClassOutput, UpdateClassDataOutput, UpdateClassOutput } from '../validation'

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
    where: { id: classId, programTrack: { orgId } },
    data:  { deletedAt: new Date() },
  }))
  await invalidateEvent('CLASS_REMOVED', orgId, classId)
  return result
}

// src/services/academic-year/database/academic-year.mutations.ts
import { prisma } from '@/lib/prisma'
import { tryConstraint } from '@/utils/server/prisma'
import { invalidateEvent } from '@/cache/server/key'
import type { CreateAcademicYearOutput } from '../validation'

export async function createAcademicYear(data: CreateAcademicYearOutput & { orgId: string }) {
  const result = await tryConstraint(
    prisma.academicYear.create({
      data: {
        name: data.name,
        startDate: data.startDate,
        endDate: data.endDate,
        orgId: data.orgId,
        isCurrent: false,
      },
      select: { id: true, name: true, startDate: true, endDate: true, isCurrent: true },
    })
  )
  await invalidateEvent('ACADEMIC_YEAR_CREATED', data.orgId)
  return result
}

export async function setCurrentYear(academicYearId: string, orgId: string) {
  const result = await tryConstraint(
    prisma.$transaction(async (tx) => {
      await tx.academicYear.updateMany({
        where: { orgId, isCurrent: true },
        data: { isCurrent: false },
      })
      return tx.academicYear.update({
        where: { id: academicYearId, orgId },
        data: { isCurrent: true },
        select: { id: true, name: true, isCurrent: true },
      })
    })
  )
  await invalidateEvent('ACADEMIC_YEAR_UPDATED', orgId)
  return result
}

export type UpdateAcademicYearData = {
  name?: string
  startDate?: Date
  endDate?: Date
}

export async function updateAcademicYear(academicYearId: string, orgId: string, data: UpdateAcademicYearData) {
  const result = await tryConstraint(
    prisma.academicYear.update({
      where: { id: academicYearId, orgId },
      data,
      select: { id: true, name: true, startDate: true, endDate: true, isCurrent: true },
    })
  )
  await invalidateEvent('ACADEMIC_YEAR_UPDATED', orgId)
  return result
}

export async function removeAcademicYear(academicYearId: string, orgId: string) {
  const result = await tryConstraint(
    prisma.academicYear.update({
      where: { id: academicYearId, orgId },
      data: { isActive: false, isCurrent: false },
      select: { id: true },
    })
  )
  await invalidateEvent('ACADEMIC_YEAR_REMOVED', orgId)
  return result
}

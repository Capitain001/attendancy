// src/services/academic-year/database/academic-year.queries.ts
import { cacheTag, cacheLife } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { CACHE } from '@/cache/server/key'

export async function getAcademicYears(orgId: string) {
  'use cache'
  cacheTag(CACHE.ACADEMIC_YEAR(orgId))
  cacheLife(CACHE.ACADEMIC_YEAR.life)
  return prisma.academicYear.findMany({
    where: { orgId, isActive: true },
    select: { id: true, name: true, startDate: true, endDate: true, isCurrent: true },
    orderBy: { startDate: 'desc' },
  })
}

export async function getCurrentYear(orgId: string) {
  'use cache'
  cacheTag(CACHE.ACADEMIC_YEAR(orgId))
  cacheLife(CACHE.ACADEMIC_YEAR.life)
  return prisma.academicYear.findFirst({
    where: { orgId, isCurrent: true, isActive: true },
    select: { id: true, name: true, startDate: true, endDate: true },
  })
}

// src/services/class/database/class.queries.ts
import { cacheTag, cacheLife } from 'next/cache'
import { prisma } from '@/lib/db'
import { CACHE } from '@/cache/server/key'

export async function getClasses(orgId: string, yearId?: string) {
  'use cache'
  cacheTag(CACHE.CLASS(orgId))
  cacheLife(CACHE.CLASS.life)
  return prisma.class.findMany({
    where: {
      deletedAt: null,
      programTrack: { orgId },
      ...(yearId ? { academicYearId: yearId } : {}),
    },
    select: {
      id: true,
      name: true,
      level: true,
      academicYearId: true,
      programTrackId: true,
      academicYear: { select: { id: true, name: true } },
      programTrack:  { select: { id: true, name: true } },
      _count: { select: { studentEnrollments: true, courses: true } },
    },
    orderBy: [{ programTrack: { name: 'asc' } }, { name: 'asc' }],
  })
}

export async function getClass(classId: string, orgId: string) {
  'use cache'
  cacheTag(CACHE.CLASS(orgId))
  cacheTag(CACHE.CLASS(orgId, classId))
  cacheLife(CACHE.CLASS.life)
  return prisma.class.findFirst({
    where: { id: classId, deletedAt: null, programTrack: { orgId } },
    select: {
      id: true,
      name: true,
      level: true,
      programId: true,
      programTrack: { select: { id: true, name: true } },
      academicYear: { select: { id: true, name: true, isCurrent: true } },
      _count: { select: { studentEnrollments: true, courses: true, groups: true } },
    },
  })
}

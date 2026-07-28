// src/services/ue-course/database/ue-course.queries.ts
import { cacheTag, cacheLife } from 'next/cache'
import { prisma } from '@/lib/db'
import { CACHE } from '@/cache/server/key'

export async function getUECoursesByUE(ueId: string, orgId: string) {
  'use cache'
  cacheTag(CACHE.UE_COURSE(orgId))
  cacheTag(CACHE.UE_COURSE(orgId, ueId))
  cacheLife(CACHE.UE_COURSE.life)
  return prisma.uECourse.findMany({
    where: { ueId, orgId, deletedAt: null },
    select: {
      id: true, name: true, code: true,
      credits: true, duration: true, order: true,
      description: true,
    },
    orderBy: [{ order: 'asc' }, { name: 'asc' }],
  })
}

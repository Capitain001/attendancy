import { cacheTag, cacheLife } from 'next/cache'
import { prisma } from '@/lib/db'
import { CACHE } from '@/cache/server/key'

export async function getTeacherUnavailabilities(teacherId: string, orgId: string) {
  'use cache'
  cacheTag(CACHE.TEACHER_UNAVAILABILITY(orgId))
  cacheTag(CACHE.TEACHER_UNAVAILABILITY(orgId, teacherId))
  cacheLife(CACHE.TEACHER_UNAVAILABILITY.life)
  return prisma.teacherUnavailability.findMany({
    where: { teacherId, orgId },
    select: {
      id: true, type: true, reason: true,
      dayOfWeek: true, startTime: true, endTime: true,
      startDate: true, endDate: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  })
}

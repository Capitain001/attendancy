import { cacheTag, cacheLife } from 'next/cache'
import { prisma } from '@/lib/db'
import { CACHE } from '@/cache/server/key'

const slotInclude = {
  course:  { select: { id: true, name: true } },
  room:    { select: { id: true, name: true } },
  teacher: {
    select: {
      id: true,
      user: { select: { firstName: true, lastName: true } },
    },
  },
} as const

export async function getWeeklyTemplates(orgId: string) {
  'use cache'
  cacheTag(CACHE.WEEKLY_TEMPLATE(orgId))
  cacheLife(CACHE.WEEKLY_TEMPLATE.life)

  return prisma.weeklyTemplate.findMany({
    where:   { orgId, deletedAt: null },
    select: {
      id: true, name: true, isActive: true, createdAt: true,
      _count: { select: { slots: { where: { deletedAt: null } } } },
    },
    orderBy: { name: 'asc' },
  })
}

export async function getWeeklyTemplate(id: string, orgId: string) {
  'use cache'
  cacheTag(CACHE.WEEKLY_TEMPLATE(orgId))
  cacheTag(CACHE.WEEKLY_TEMPLATE(orgId, id))
  cacheLife(CACHE.WEEKLY_TEMPLATE.life)

  return prisma.weeklyTemplate.findFirst({
    where: { id, orgId, deletedAt: null },
    include: {
      slots: {
        where:   { deletedAt: null },
        include: slotInclude,
        orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
      },
    },
  })
}

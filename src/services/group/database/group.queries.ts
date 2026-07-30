// src/services/group/database/group.queries.ts
import { cacheTag, cacheLife } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { CACHE } from '@/cache/server/key'

export async function getGroupsByClass(classId: string, orgId: string) {
  'use cache'
  cacheTag(CACHE.GROUP(orgId, classId))
  cacheLife(CACHE.GROUP.life)
  return prisma.group.findMany({
    where: { classId, deletedAt: null, class: { programTrack: { orgId } } },
    select: {
      id: true, name: true, description: true,
      _count: { select: { studentGroups: true } },
    },
    orderBy: { name: 'asc' },
  })
}
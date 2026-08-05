// src/services/department/database/department.queries.ts
import { cacheTag, cacheLife } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { CACHE } from '@/cache/server/key'

export async function getDepartments(orgId: string) {
  'use cache'
  cacheTag(CACHE.DEPARTMENT(orgId))
  cacheLife(CACHE.DEPARTMENT.life)
  return prisma.department.findMany({
    where: { orgId },
    select: {
      id: true,
      name: true,
      _count: { select: { programTracks: true, teachers: true, ues: true } },
    },
    orderBy: { name: 'asc' },
  })
}

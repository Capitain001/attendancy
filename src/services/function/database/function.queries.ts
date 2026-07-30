// src/services/function/database/function.queries.ts
import { cacheTag, cacheLife } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { CACHE } from '@/cache/server/key'

export async function getFunctions(orgId: string) {
  'use cache'
  cacheTag(CACHE.FUNCTION(orgId))
  cacheLife(CACHE.FUNCTION.life)
  return prisma.function.findMany({
    where: { orgId },
    select: {
      id: true,
      name: true,
      description: true,
      icon: true,
      isMain: true,
      _count: { select: { users: true } },
    },
    orderBy: [{ isMain: 'desc' }, { name: 'asc' }],
  })
}

export async function getFunctionByName(name: string, orgId: string) {
  'use cache'
  cacheTag(CACHE.FUNCTION(orgId))
  cacheLife(CACHE.FUNCTION.life)
  return prisma.function.findUnique({
    where: { name_orgId: { name, orgId } },
    select: { id: true, name: true, description: true, icon: true, isMain: true },
  })
}

export async function getFunctionsByNames(names: string[], orgId: string) {
  'use cache'
  cacheTag(CACHE.FUNCTION(orgId))
  cacheLife(CACHE.FUNCTION.life)
  return prisma.function.findMany({
    where: { orgId, name: { in: names } },
    select: { id: true, name: true },
  })
}

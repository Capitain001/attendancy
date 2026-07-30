import { cacheTag, cacheLife } from 'next/cache'
import { Role } from '@/generated/prisma'
import { prisma } from '@/lib/prisma'
import { CACHE, CACHE_LIFE } from '@/cache/server/key'

export async function getUserRoleStats(orgId: string) {
  const grouped = await prisma.userOrganization.groupBy({
    by: ['role'],
    where: { orgId, user: { deletedAt: null } },
    _count: { role: true },
  })
  const byRole = Object.fromEntries(grouped.map(g => [g.role, g._count.role]))
  const total = grouped.reduce((sum, g) => sum + g._count.role, 0)
  return {
    total,
    direction: byRole[Role.DIRECTION] ?? 0,
    teachers:  byRole[Role.TEACHER]   ?? 0,
    students:  byRole[Role.STUDENT]   ?? 0,
    others:    (byRole[Role.ADMIN] ?? 0) + (byRole[Role.PARENT] ?? 0),
  }
}

const functionSelect = {
  id:          true,
  name:        true,
  description: true,
  icon:        true,
} as const

const userFunctionSelect = {
  id:         true,
  userId:     true,
  functionId: true,
  assignedAt: true,
  function: { select: functionSelect },
} as const

const userCoreSelect = {
  id:         true,
  firstName:  true,
  lastName:   true,
  email:      true,
  avatar_url: true,
} as const

export async function getUserProfile(userId: string, orgId: string) {
  'use cache'
  cacheTag(CACHE.ORG(orgId))
  cacheLife(CACHE_LIFE.MEDIUM)
  return prisma.user.findFirst({
    where: {
      id: userId,
      deletedAt: null,
      userOrganizations: { some: { orgId } },
    },
    select: {
      ...userCoreSelect,
      functions: {
        where: { function: { orgId } },
        select: userFunctionSelect,
      },
    },
  })
}

export async function getUsersByRoles(roles: Role[], orgId: string) {
  'use cache'
  cacheTag(CACHE.ORG(orgId))
  cacheLife(CACHE_LIFE.MEDIUM)
  const records = await prisma.userOrganization.findMany({
    where: { orgId, role: { in: roles }, user: { deletedAt: null } },
    select: {
      user: {
        select: {
          ...userCoreSelect,
          functions: {
            where: { function: { orgId } },
            select: userFunctionSelect,
          },
        },
      },
    },
    orderBy: [{ role: 'asc' }, { user: { lastName: 'asc' } }],
  })
  return records.map(r => r.user)
}

export async function getFunctionProfiles(functionId: string, orgId: string) {
  'use cache'
  cacheTag(CACHE.ORG(orgId))
  cacheLife(CACHE_LIFE.MEDIUM)
  return prisma.userFunction.findMany({
    where: { functionId, function: { orgId } },
    select: {
      id:         true,
      userId:     true,
      functionId: true,
      assignedAt: true,
      user:       { select: userCoreSelect },
      function:   { select: functionSelect },
    },
    orderBy: { assignedAt: 'desc' },
  })
}

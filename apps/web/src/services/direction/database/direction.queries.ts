import { cacheTag, cacheLife } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { CACHE } from '@/cache/server/key'

const directionSelect = {
  id:        true,
  userId:    true,
  orgId:     true,
  createdAt: true,
  user: {
    select: {
      id:         true,
      firstName:  true,
      lastName:   true,
      email:      true,
      avatar_url: true,
      status:     true,
      phone:      true,
      functions: {
        select: {
          assignedAt: true,
          assignedBy: true,
          function: {
            select: { id: true, name: true, description: true, icon: true, isMain: true },
          },
        },
      },
    },
  },
} as const

export async function getDirectionMembers(orgId: string, functionId?: string) {
  'use cache'
  cacheTag(CACHE.DIRECTION(orgId))
  cacheLife(CACHE.DIRECTION.life)
  return prisma.direction.findMany({
    where: {
      orgId,
      deletedAt: null,
      ...(functionId
        ? { user: { functions: { some: { functionId } } } }
        : {}),
    },
    select: {
      ...directionSelect,
      user: {
        select: {
          ...directionSelect.user.select,
          functions: {
            where: { function: { orgId } },
            select: directionSelect.user.select.functions.select,
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })
}

export async function getDirectionMember(directionId: string, orgId: string) {
  'use cache'
  cacheTag(CACHE.DIRECTION(orgId))
  cacheLife(CACHE.DIRECTION.life)
  return prisma.direction.findFirst({
    where: { id: directionId, orgId, deletedAt: null },
    select: {
      ...directionSelect,
      user: {
        select: {
          ...directionSelect.user.select,
          functions: {
            where: { function: { orgId } },
            select: directionSelect.user.select.functions.select,
          },
        },
      },
    },
  })
}

export async function getDirectionMemberByUserId(userId: string, orgId: string) {
  'use cache'
  cacheTag(CACHE.DIRECTION(orgId))
  cacheLife(CACHE.DIRECTION.life)
  return prisma.direction.findFirst({
    where: { userId, orgId, deletedAt: null },
    select: {
      ...directionSelect,
      user: {
        select: {
          ...directionSelect.user.select,
          functions: {
            where: { function: { orgId } },
            select: directionSelect.user.select.functions.select,
          },
        },
      },
    },
  })
}

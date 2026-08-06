// src/services/ue/database/ue.queries.ts
import { cacheTag, cacheLife } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { CACHE } from '@/cache/server/key'

export async function getUEs(orgId: string, departmentId?: string) {
  'use cache'
  cacheTag(CACHE.UE(orgId))
  cacheLife(CACHE.UE.life)
  return prisma.uE.findMany({
    where: {
      orgId,
      deletedAt: null,
      ...(departmentId && { departmentId }),
    },
    select: {
      id: true,
      name: true,
      code: true,
      isOptional: true,
      departmentId: true,
      department: { select: { id: true, name: true } },
    },
    orderBy: { name: 'asc' },
  })
}

export async function getProgramUEs(programId: string, orgId: string) {
  'use cache'
  cacheTag(CACHE.PROGRAM_TRACK(orgId))
  cacheLife(CACHE.PROGRAM_TRACK.life)
  return prisma.programUE.findMany({
    where: { programId, program: { orgId } },
    select: {
      id: true,
      semester: true,
      order: true,
      ue: {
        select: {
          id: true,
          name: true,
          code: true,
          description: true,
          imageUrl: true,
          departmentId: true,
          department: { select: { id: true, name: true } },
          ueCourses: {
            where: { deletedAt: null },
            select: { id: true, order: true, name: true, code: true, credits: true, duration: true },
            orderBy: [{ order: 'asc' }, { name: 'asc' }],
          },
        },
      },
    },
    orderBy: [{ semester: 'asc' }, { order: 'asc' }],
  })
}

export async function getUEByCode(code: string, orgId: string) {
  return prisma.uE.findFirst({
    where: { code, orgId, deletedAt: null },
    select: { id: true, name: true, code: true },
  })
}

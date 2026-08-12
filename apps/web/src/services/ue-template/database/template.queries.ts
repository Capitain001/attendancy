import { prisma } from '@/lib/prisma'
import { CACHE, CACHE_LIFE } from '@/cache/server/key'
import { cacheLife, cacheTag } from 'next/cache'

export async function getProgramTemplates(referentialId: string) {
  'use cache'
  cacheTag(CACHE.PROGRAM_TEMPLATE())
  cacheLife(CACHE_LIFE.LONG)

  return prisma.programTemplate.findMany({
    where: { referentialId },
    include: {
      programUEs: {
        include: {
          ueTemplate: {
            include: {
              elements: true,
            },
          },
        },
      },
    },
    orderBy: [
      { domain: 'asc' },
      { mention: 'asc' },
      { specialty: 'asc' },
    ],
  })
}

export async function getOrgProgramTemplates(orgId: string) {
  'use cache'
  cacheTag(CACHE.ORG_PROGRAM_TEMPLATE(orgId))
  cacheLife(CACHE_LIFE.LONG)

  return prisma.orgProgramTemplate.findMany({
    where: { orgId },
    include: {
      programTemplate: true,
    },
  })
}

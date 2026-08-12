import { prisma } from '@/lib/prisma'
import { CACHE, CACHE_LIFE } from '@/cache/server/key'
import { cacheLife, cacheTag } from 'next/cache'

export async function getReferentials() {
  'use cache'
  cacheTag(CACHE.REFERENTIAL())
  cacheLife(CACHE_LIFE.LONG)

  return prisma.referential.findMany({
    orderBy: { createdAt: 'desc' },
  })
}

export async function getReferential(referentialId: string) {
  'use cache'
  cacheTag(CACHE.REFERENTIAL(referentialId))
  cacheLife(CACHE_LIFE.LONG)

  return prisma.referential.findUnique({
    where: { id: referentialId },
  })
}

// Pour la vue détaillée, on peut récupérer le référentiel avec tous ses programmes
export async function getReferentialWithPrograms(referentialId: string) {
  'use cache'
  cacheTag(CACHE.REFERENTIAL(referentialId), CACHE.PROGRAM_TEMPLATE())
  cacheLife(CACHE_LIFE.LONG)

  return prisma.referential.findUnique({
    where: { id: referentialId },
    include: {
      programs: {
        orderBy: [
          { domain: 'asc' },
          { mention: 'asc' },
          { specialty: 'asc' },
        ],
        include: {
          programUEs: {
            orderBy: [
              { semester: 'asc' },
              { order: 'asc' },
            ],
            include: {
              ueTemplate: {
                include: {
                  elements: {
                    orderBy: { order: 'asc' },
                  },
                },
              },
            },
          },
        },
      },
    },
  })
}

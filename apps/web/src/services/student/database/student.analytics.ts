import { prisma } from '@/lib/prisma'
import { cacheTag, cacheLife } from 'next/cache'
import { CACHE } from '@/cache/server/key'

// Comptage léger : total d'étudiants actifs d'une org, filtrable par classe
// (via l'inscription active — pas de FK directe Student → Class).
export async function getStudentsStats(orgId: string, classId?: string) {
  'use cache'
  cacheTag(CACHE.STUDENT(orgId, classId))
  cacheLife('seconds')

  const count = await prisma.student.count({
    where: {
      orgId,
      deletedAt: null,
      ...(classId && {
        studentEnrollments: {
          some: { classId, endedAt: null },
        },
      }),
    },
  })

  return { count }
}

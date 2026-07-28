import { prisma } from '@/lib/db'
import { cacheTag, cacheLife } from 'next/cache'
import { CACHE } from '@/cache/server/key'

export type OrgPlanningResources = Awaited<ReturnType<typeof getOrgPlanningResources>>

/**
 * Ressources planning à l'échelle de l'organisation.
 * Utilisé pour alimenter les filtres de la vue planning globale (Direction).
 *
 * Shape plate — pas de hiérarchie cours/enseignants :
 * - classes  : toutes les classes de l'org
 * - teachers : tous les profs rattachés à au moins un cours de l'org
 * - rooms    : toutes les salles de l'org
 */
export async function getOrgPlanningResources(orgId: string) {
  'use cache'
  cacheTag(CACHE.TEACHER(orgId))
  cacheTag(CACHE.ROOM(orgId))
  cacheTag(CACHE.CLASS(orgId))
  cacheLife('hours')

  const [classes, teachers, rooms] = await Promise.all([
    prisma.class.findMany({
      where: {
        deletedAt:    null,
        academicYear: { orgId },
      },
      select:  { id: true, name: true },
      orderBy: { name: 'asc' },
    }),

    prisma.teacher.findMany({
      where: {
        deletedAt: null,
        courses: {
          some: { course: { orgId, deletedAt: null } },
        },
      },
      select: {
        id:   true,
        user: {
          select: {
            firstName:  true,
            lastName:   true,
            avatar_url: true,
          },
        },
      },
      orderBy: { user: { lastName: 'asc' } },
    }),

    prisma.room.findMany({
      where:   { orgId, deletedAt: null },
      select:  { id: true, name: true },
      orderBy: { name: 'asc' },
    }),
  ])

  return {
    classes,
    teachers: teachers.map((t) => ({
      id:        t.id,
      name:      [t.user.firstName, t.user.lastName].filter(Boolean).join(' ').trim() || 'Sans nom',
      avatarUrl: t.user.avatar_url,
    })),
    rooms,
  }
}

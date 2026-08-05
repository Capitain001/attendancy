import { prisma } from '@/lib/prisma'
import { cacheTag, cacheLife } from 'next/cache'
import { CACHE } from '@/cache/server/key'

/* =========================
   RESSOURCES CLASSE (vue planning par classe)
========================= */

async function fetchClassPlanningRaw(classId: string, orgId: string) {
  return Promise.all([
    prisma.class.findFirst({
      where: { id: classId, deletedAt: null },
      select: {
        id: true,
        name: true,
        groups: {
          where: { deletedAt: null },
          select: { id: true, name: true },
        },
        courses: {
          where: { orgId, deletedAt: null },
          select: {
            id: true,
            name: true,
            teachers: {
              select: {
                isMain: true,
                teacher: {
                  select: {
                    id: true,
                    user: {
                      select: {
                        firstName: true,
                        lastName: true,
                        email: true,
                        avatar_url: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    }),
    prisma.room.findMany({
      where: { orgId, deletedAt: null },
      select: { id: true, name: true },
    }),
  ])
}

type ClassPlanningRaw = Awaited<ReturnType<typeof fetchClassPlanningRaw>>

function mapClassPlanningResources([classRow, rooms]: ClassPlanningRaw) {
  return {
    class: { id: classRow!.id, name: classRow!.name },
    rooms,
    groups: classRow!.groups,
    courses: classRow!.courses.map((c) => ({
      id: c.id,
      name: c.name,
      teachers: c.teachers
        .map((ct) => ({
          id: ct.teacher.id,
          name: [ct.teacher.user.firstName, ct.teacher.user.lastName]
            .filter(Boolean)
            .join(' ')
            .trim() || 'Sans nom',
          email: ct.teacher.user.email,
          avatar_url: ct.teacher.user.avatar_url,
          isMain: ct.isMain,
        }))
        .sort((a, b) => {
          if (a.isMain && !b.isMain) return -1
          if (!a.isMain && b.isMain) return 1
          return a.name.localeCompare(b.name)
        }),
    })),
  }
}

export async function getPlanningResources(classId: string, orgId: string) {
  'use cache'
  cacheTag(CACHE.CLASS(orgId))
  cacheTag(CACHE.ROOM(orgId))
  cacheLife('hours')

  const raw = await fetchClassPlanningRaw(classId, orgId)
  if (!raw[0]) return null
  return mapClassPlanningResources(raw)
}

export type PlanningResources = Awaited<ReturnType<typeof getPlanningResources>>

/* =========================
   RESSOURCES ORG (vue planning direction)
========================= */

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

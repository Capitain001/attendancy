// src/services/group/database/group.queries.ts
import { cacheTag, cacheLife } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { CACHE } from '@/cache/server/key'

export async function getGroupsByClass(classId: string, orgId: string) {
  'use cache'
  cacheTag(CACHE.GROUP(orgId, classId))
  cacheLife(CACHE.GROUP.life)
  return prisma.group.findMany({
    where: { classId, deletedAt: null, class: { programTrack: { orgId } } },
    select: {
      id: true, name: true, description: true,
      _count: { select: { studentGroups: true } },
    },
    orderBy: { name: 'asc' },
  })
}

// Inscriptions de la classe + flag d'appartenance au groupe (modal « gérer les membres »).
// L'arg `groupId` fait partie de la clé de cache 'use cache' → une entrée par groupe ;
// le tag CACHE.GROUP(orgId, classId) les invalide toutes à chaque GROUP_UPDATED.
export async function getGroupEligibleStudents(classId: string, groupId: string, orgId: string) {
  'use cache'
  cacheTag(CACHE.GROUP(orgId, classId))
  cacheLife(CACHE.GROUP.life)
  const enrollments = await prisma.studentEnrollment.findMany({
    where: { classId, class: { programTrack: { orgId } } },
    select: {
      id: true,
      student: {
        select: {
          id: true,
          userId: true,
          user: { select: { firstName: true, lastName: true } },
        },
      },
      studentGroups: { where: { groupId }, select: { groupId: true } },
    },
  })
  return enrollments.map((e) => ({
    enrollmentId: e.id,
    inGroup: e.studentGroups.length > 0,
    student: e.student,
  }))
}

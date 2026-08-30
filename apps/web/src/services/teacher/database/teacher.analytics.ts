// src/services/teacher/database/teacher.analytics.ts

import { prisma } from '@/lib/prisma'
import { cacheTag, cacheLife } from 'next/cache'
import { CACHE } from '@/cache/server/key'

/**
 * Stats d'un enseignant, scopées orgId.
 * - assiduite   : taux de démarrage (P-27) = completed / (completed + missed)
 *                 — exclut CANCELED et les schedules futurs par construction.
 * - ponctualite : % de sessions non isLate — lit Session.isLate (calculé et
 *                 persisté par teacher_check_in() côté DB), jamais recalculé.
 * - courses     : nombre de CourseTeacher actifs (course non archivée).
 * - annulations : nombre de schedules CANCELED.
 */
export async function getTeacherStats(teacherId: string, orgId: string) {
  'use cache'
  cacheTag(CACHE.TEACHER(orgId, teacherId))
  cacheLife(CACHE.TEACHER.life)

  const [teacher, completed, cancelled, missed, courses, sessions] = await Promise.all([
    prisma.teacher.findUnique({
      where: { id: teacherId, orgId, deletedAt: null },
      select: { id: true },
    }),
    prisma.schedule.count({ where: { teacherId, orgId, deletedAt: null, status: 'COMPLETED' } }),
    prisma.schedule.count({ where: { teacherId, orgId, deletedAt: null, status: 'CANCELED' } }),
    prisma.schedule.count({ where: { teacherId, orgId, deletedAt: null, status: 'MISSED' } }),
    prisma.courseTeacher.count({ where: { teacherId, course: { orgId, deletedAt: null } } }),
    prisma.session.findMany({
      where: { schedule: { teacherId, orgId, deletedAt: null } },
      select: { isLate: true },
    }),
  ])

  if (!teacher) {
    throw new Error('Enseignant introuvable')
  }

  const eligible = completed + missed
  const ponctuelCount = sessions.filter((s) => !s.isLate).length

  return {
    courses,
    assiduite: eligible > 0 ? Math.round((completed / eligible) * 100) : 0,
    ponctualite: sessions.length > 0 ? Math.round((ponctuelCount / sessions.length) * 100) : 0,
    annulations: cancelled,
  }
}

/**
 * Stats globales enseignants d'une org — 4 count() indexés en parallèle
 * (scalable sur gros effectifs, pas de fetch de lignes).
 * Statut scopé UserOrganization (P-15) — pas User.status (global).
 * withCourses exclut les CourseTeacher pointant sur une course archivée.
 */
export async function getOrganizationTeacherStats(orgId: string) {
  'use cache'
  cacheTag(CACHE.ORG(orgId))
  cacheLife(CACHE.ORG.life)

  const [total, active, inactive, withCourses] = await Promise.all([
    prisma.teacher.count({ where: { orgId, deletedAt: null } }),
    prisma.teacher.count({
      where: { orgId, deletedAt: null, user: { userOrganizations: { some: { orgId, status: 'ACTIVE' } } } },
    }),
    prisma.teacher.count({
      where: { orgId, deletedAt: null, user: { userOrganizations: { some: { orgId, status: 'INACTIVE' } } } },
    }),
    prisma.teacher.count({
      where: { orgId, deletedAt: null, courses: { some: { course: { deletedAt: null } } } },
    }),
  ])

  return { total, active, inactive, withCourses }
}
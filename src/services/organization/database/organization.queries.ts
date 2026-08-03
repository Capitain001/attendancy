// src/services/org/database/org.queries.ts
// Lectures Prisma du service org — Prisma pur, AUCUNE auth ici.
import { cacheTag, cacheLife } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { CACHE } from '@/cache/server/key'
import type { OrgDetails } from '../types'

export async function getOrgIdentity(orgId: string) {
  'use cache'
  cacheTag(CACHE.ORG(orgId))
  cacheLife(CACHE.ORG.life)

  return prisma.organization.findUnique({
    where: { id: orgId },
    select: { id: true, name: true, email: true, domain: true, logo: true, slug: true },
  })
}

export async function getOrgUsage(orgId: string) {
  'use cache'
  cacheTag(CACHE.ORG(orgId))
  cacheLife(CACHE.ORG.life)

  return prisma.organizationUsage.findUnique({
    where: { orgId },
    select: {
      currentUsers: true,
      usedStorage: true,
      activeCourses: true,
      activeRooms: true,
      updatedAt: true,
    },
  })
}

export async function getOrgDetails(orgId: string) {
  'use cache'
  cacheTag(CACHE.ORG(orgId))
  cacheLife(CACHE.ORG.life)

  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    select: { details: true },
  })
  return (org?.details ?? {}) as OrgDetails
}

// Métriques opérationnelles du jour : sessions actives, séances, absences, séances terminées.
// Pas de cache — données "temps réel" du jour, la fraîcheur prime sur la performance.
export async function getOrgDailyMetrics(orgId: string) {
  const now = new Date()
  const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0)
  const dayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)

  const [activeSessions, todaySchedules, todayAbsences, completedSchedules] = await Promise.all([
    prisma.session.count({
      where: { status: 'ACTIVE', schedule: { orgId, deletedAt: null } },
    }),
    prisma.schedule.count({
      where: { orgId, deletedAt: null, startTime: { gte: dayStart, lte: dayEnd } },
    }),
    prisma.attendance.count({
      where: {
        status: 'ABSENT',
        schedule: { orgId, deletedAt: null, startTime: { gte: dayStart, lte: dayEnd } },
      },
    }),
    prisma.schedule.count({
      where: { orgId, deletedAt: null, status: 'COMPLETED', startTime: { gte: dayStart, lte: dayEnd } },
    }),
  ])

  return { activeSessions, todaySchedules, todayAbsences, completedSchedules }
}

// Lookup public par slug (page de login, avant authentification — pas d'orgId token disponible).
// Exception documentée au pattern : aucune donnée sensible exposée (identité publique de l'org).
export async function getOrgBySlug(slug: string) {
  'use cache'
  cacheTag(CACHE.ORG(slug))
  cacheLife(CACHE.ORG.life)

  return prisma.organization.findUnique({
    where: { slug },
    select: { id: true, name: true, slug: true, email: true, logo: true, domain: true },
  })
}

// Compteurs de ressources structurelles (cours, classes, salles, enseignants, étudiants).
export async function getOrgResourcesCounts(orgId: string) {
  'use cache'
  cacheTag(CACHE.ORG(orgId))
  cacheLife(CACHE.ORG.life)

  const [courses, classes, rooms, teachers, students] = await Promise.all([
    prisma.course.count({ where: { orgId, deletedAt: null } }),
    prisma.class.count({ where: { deletedAt: null, academicYear: { orgId } } }),
    prisma.room.count({ where: { orgId, deletedAt: null } }),
    prisma.teacher.count({
      where: {
        deletedAt: null,
        courses: { some: { course: { orgId, deletedAt: null } } },
      },
    }),
    prisma.student.count({
      where: {
        deletedAt: null,
        studentEnrollments: {
          some: { endedAt: null, class: { academicYear: { orgId } } },
        },
      },
    }),
  ])

  return { courses, classes, rooms, teachers, students }
}


/**
 * Récupère une organisation par son slug (public)
 * Utilisé pour les pages publiques (onboarding, landing, etc.)
 */
export async function getOrganizationBySlug(slug: string) {
  "use cache";
  cacheTag(CACHE.ORG(slug));
  cacheLife("hours");

  return prisma.organization.findUnique({
    where: { slug },
    include: {
      settings: true,
      usage: true,
    },
  });
}
// src/services/org/database/org.queries.ts
// Lectures Prisma du service org — Prisma pur, AUCUNE auth ici.
import { prisma } from '@/lib/db'
import type { OrgDetails } from '../types'

export async function getOrganizationById(id: string) {
  return prisma.organization.findUnique({
    where: { id },
    include: { settings: true, usage: true },
  })
}

export async function getOrgIdentity(orgId: string) {
  return prisma.organization.findUnique({
    where: { id: orgId },
    select: { id: true, name: true, email: true, domain: true, logo: true, slug: true },
  })
}

export async function getOrgUsage(orgId: string) {
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
  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    select: { details: true },
  })
  return (org?.details ?? {}) as OrgDetails
}

// Métriques opérationnelles du jour : sessions actives, séances, absences, séances terminées.
export async function getOrgDailyMetrics(orgId: string) {
  const now = new Date()
  const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0)
  const dayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)

  const [activeSessions, todaySchedules, todayAbsences, completedSchedules] = await Promise.all([
    prisma.session.count({
      where: { status: 'ACTIVE', deletedAt: null, schedule: { orgId, deletedAt: null } },
    }),
    prisma.schedule.count({
      where: { orgId, deletedAt: null, startTime: { gte: dayStart, lte: dayEnd } },
    }),
    prisma.attendance.count({
      where: {
        status: 'ABSENT',
        deletedAt: null,
        schedule: { orgId, deletedAt: null, startTime: { gte: dayStart, lte: dayEnd } },
      },
    }),
    prisma.schedule.count({
      where: { orgId, deletedAt: null, status: 'COMPLETED', startTime: { gte: dayStart, lte: dayEnd } },
    }),
  ])

  return { activeSessions, todaySchedules, todayAbsences, completedSchedules }
}

export async function getOrgBySlug(slug: string) {
  return prisma.organization.findUnique({
    where: { slug },
    select: { id: true, name: true, slug: true, email: true, logo: true, domain: true },
  })
}

// Compteurs de ressources structurelles (cours, classes, salles, enseignants, étudiants).
export async function getOrgResourcesCounts(orgId: string) {
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
          some: { deletedAt: null, class: { academicYear: { orgId } } },
        },
      },
    }),
  ])

  return { courses, classes, rooms, teachers, students }
}

// src/services/audit/queries.ts
//
// Lectures de l'AuditLog (owner audit). Journal admin scopé.

import { prisma } from "@/lib/prisma";

/**
 * Journal des actions admin concernant un étudiant (fiche direction).
 * Les écritures ciblent soit le studentId (lien parent), soit le userId du
 * membre (changement de statut) → on filtre sur les deux. Index existant
 * `@@index([resource, resourceId])`.
 */
export async function getStudentAuditLog(params: {
  orgId: string;
  studentId: string;
  userId: string;
  limit?: number;
}) {
  const { orgId, studentId, userId, limit = 20 } = params;

  return prisma.auditLog.findMany({
    where: {
      orgId,
      resource: "STUDENT",
      resourceId: { in: [studentId, userId] },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      action: true,
      createdAt: true,
      details: true,
      userId: true,
      // Acteur (qui a réalisé l'action) — affiché « par … » dans le journal.
      user: { select: { firstName: true, lastName: true } },
    },
  });
}

/**
 * Journal des modifications de planning sur une plage (Roadmap 1.4).
 * « Qui a créé / modifié / annulé / supprimé quelle séance, quand. »
 * Scopé org + plage [start, end[. Détails dénormalisés (courseName, day) à l'écriture.
 */
export async function getScheduleAuditLog(params: {
  orgId: string;
  start: Date;
  end: Date;
  limit?: number;
}) {
  const { orgId, start, end, limit = 50 } = params;

  return prisma.auditLog.findMany({
    where: {
      orgId,
      resource: "SCHEDULE",
      createdAt: { gte: start, lte: end },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      action: true,
      createdAt: true,
      details: true,
      userId: true,
      user: { select: { firstName: true, lastName: true } },
    },
  });
}

/**
 * Journal des actions admin concernant un enseignant (fiche direction).
 * L'audit prof utilise `resource: "USER"` (l'enum Resource n'a pas TEACHER) +
 * `resourceId = userId`. On filtre aussi sur teacherId par robustesse.
 */
export async function getTeacherAuditLog(params: {
  orgId: string;
  teacherId: string;
  userId: string;
  limit?: number;
}) {
  const { orgId, teacherId, userId, limit = 20 } = params;

  return prisma.auditLog.findMany({
    where: {
      orgId,
      resource: "TEACHER",
      resourceId: { in: [teacherId, userId] },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      action: true,
      createdAt: true,
      details: true,
      userId: true,
      // Acteur (qui a réalisé l'action) — affiché « par … » dans le journal.
      user: { select: { firstName: true, lastName: true } },
    },
  });
}

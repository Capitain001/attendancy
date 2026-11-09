// src/services/attendance/database/attendance.queries.ts
import { prisma } from "@/lib/prisma";
import { AttendanceStatus } from "@/generated/prisma/client";
import { computeAttendanceRate, type AttendanceCounts } from "../policy";
import { completedScheduleWhere } from "./filter";

export async function getScheduleAttendances(
    scheduleId: string
  ) {
    return prisma.attendance.findMany({
      where: {
        scheduleId,
      },
  
      select: {
        id: true,
        status: true,
        recordedAt: true,
  
        student: {
          select: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatar_url: true,
              },
            },
          },
        },
      },
  
      orderBy: {
        recordedAt: "asc",
      },
    });
  }

/**
 * Historique de présence d'un étudiant (lecture espace étudiant).
 * Attendance n'a pas d'orgId ? scope relationnel via `schedule.orgId`.
 */
export async function getStudentAttendances(
  studentId: string,
  orgId: string,
  options: { completedOnly?: boolean } = {},
) {
  return prisma.attendance.findMany({
    where: {
      studentId,
      schedule: {
        orgId,
        ...(options.completedOnly ? completedScheduleWhere : {}),
      },
    },
    select: {
      id: true,
      status: true,
      recordedAt: true,
      schedule: {
        select: {
          id: true,
          startTime: true,
          endTime: true,
          course: { select: { id: true, name: true } },
        },
      },
    },
    orderBy: { schedule: { startTime: "desc" } },
    take: 100,
  });
}

/**
 * Présence d'un étudiant pour un schedule donné (null = aucune ligne).
 * Champs utiles à l'écran (statut + quand scanné + note/détail), pas juste le statut.
 * Attendance n'a pas d'orgId ? scope relationnel via `schedule.orgId`.
 */
export async function getUserAttendance(
  studentId: string,
  scheduleId: string,
  orgId: string,
) {
  return prisma.attendance.findFirst({
    where: { studentId, scheduleId, schedule: { orgId } },
    select: {
      id: true,
      status: true,
      recordedAt: true,
      notes: true,
      details: true,
    },
  });
}

/**
 * Comptes de présence par statut pour un étudiant (taux non borné  D4).
 * Le calcul du taux (numérateur/dénominateur) reste chez le consommateur via `policy.ts`.
 * `range` (optionnel) borne sur `schedule.startTime`  ex. comptes du jour.
 */
type AttendanceCountsFilter = {
  classId?: string;
  courseId?: string;
  groupIds?: string[];
  range?: { start: Date; end: Date };
};

export async function getStudentAttendanceStatusCounts(
  studentId: string,
  orgId: string,
  filter: AttendanceCountsFilter = {},
): Promise<Record<AttendanceStatus, number>> {
  const { classId, courseId, groupIds, range } = filter;
  const rows = await prisma.attendance.groupBy({
    by: ["status"],
    where: {
      studentId,
      schedule: {
        orgId,
        ...completedScheduleWhere,
        ...(classId ? { classId } : {}),
        ...(courseId ? { courseId } : {}),
        ...(groupIds
          ? {
              OR: [
                { groupId: null },
                ...(groupIds.length > 0 ? [{ groupId: { in: groupIds } }] : []),
              ],
            }
          : {}),
        ...(range && { startTime: { gte: range.start, lte: range.end } }),
      },
    },
    _count: { _all: true },
  });

  const counts = Object.values(AttendanceStatus).reduce(
    (acc, status) => ({ ...acc, [status]: 0 }),
    {} as Record<AttendanceStatus, number>,
  );

  for (const row of rows) {
    counts[row.status] = (row._count as { _all: number })._all;
  }

  return counts;
}

/**
 * Taux d'assiduité de TOUS les étudiants d'une org en une requête (groupBy).
 * Sert l'annuaire direction (P-23) : repérer les décrocheurs sans N requêtes.
 * Retour indexé par studentId : taux hors PENDING (null si dénominateur 0),
 * total absences, nb de séances décomptées (dénominateur).
 */
export async function getOrgStudentAttendanceRates(
  orgId: string,
): Promise<Record<string, { rate: number | null; absent: number; denominator: number }>> {
  const rows = await prisma.attendance.groupBy({
    by: ["studentId", "status"],
    where: { schedule: { orgId, ...completedScheduleWhere } },
    _count: { _all: true },
  });

  const byStudent: Record<string, AttendanceCounts> = {};
  for (const r of rows) {
    (byStudent[r.studentId] ??= {})[r.status] = r._count._all;
  }

  const result: Record<string, { rate: number | null; absent: number; denominator: number }> = {};
  for (const [studentId, counts] of Object.entries(byStudent)) {
    const { rate, total, absent } = computeAttendanceRate(counts);
    result[studentId] = {
      rate,
      absent,
      denominator: total,
    };
  }
  return result;
}

/**
 * Résumé d'assiduité d'un étudiant (fusion owner attendance) : taux hors PENDING
 * (D4 / policy), total absences, dernières absences. Composition de domaine
 * légitime (fusion counts + historique + logique du taux), pas un wrapper.
 */
export async function getStudentAttendanceSummary(
  studentId: string,
  orgId: string,
) {
  const [counts, attendances] = await Promise.all([
    getStudentAttendanceStatusCounts(studentId, orgId),
    getStudentAttendances(studentId, orgId, { completedOnly: true }),
  ]);

  const { rate, absent } = computeAttendanceRate(counts);

  return {
    rate,
    absent,
    recentAbsences: attendances.filter((a) => a.status === "ABSENT").slice(0, 5),
  };
}

import { Prisma } from "@/generated/prisma/client";
import { activeEnrollmentWhere, activeGroupMemberWhere } from "./filter";

/**
 * Étudiants attendus à un schedule (identités, pour créer des Attendance).
 *  - groupId présent ? membres du groupe (via StudentGroup ? enrollment)
 *  - groupId absent  ? tous les inscrits actifs de la classe
 * Filtre soft-delete : enrollment ET student actifs.
 * `tx` propagé pour rester dans le contexte transactionnel de la clôture.
 */
export async function getExpectedAttendees(
  scheduleId: string,
  tx: Prisma.TransactionClient = prisma,
) {
  const schedule = await tx.schedule.findUnique({
    where: { id: scheduleId },
    select: { classId: true, groupId: true },
  });

  if (!schedule) throw new Error("Schedule introuvable.");

  // Cas groupe
  if (schedule.groupId) {
    const members = await tx.studentGroup.findMany({
      where: { groupId: schedule.groupId, ...activeGroupMemberWhere },
      select: {
        enrollment: {
          select: {
            id: true,
            studentId: true,
            student: { select: { userId: true } },
          },
        },
      },
    });
    return members.map((m) => ({
      studentId: m.enrollment.studentId,
      enrollmentId: m.enrollment.id,
      userId: m.enrollment.student.userId,
    }));
  }

  // Cas classe
  const enrollments = await tx.studentEnrollment.findMany({
    where: { classId: schedule.classId, ...activeEnrollmentWhere },
    select: {
      id: true,
      studentId: true,
      student: { select: { userId: true } },
    },
  });
  return enrollments.map((e) => ({
    studentId: e.studentId,
    enrollmentId: e.id,
    userId: e.student.userId,
  }));
}

// src/services/attendance/database/attendance.queries.ts
import { prisma } from "@/lib/prisma";
import { AttendanceStatus } from "@/generated/prisma/client";
import {
  ATTENDANCE_NUMERATOR_STATUSES,
  ATTENDANCE_DENOMINATOR_STATUSES,
} from "../policy";

export async function getScheduleAttendances(
    scheduleId: string
  ) {
    return prisma.attendance.findMany({
      where: {
        scheduleId,
        deletedAt: null,
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
 * Attendance n'a pas d'orgId → scope relationnel via `schedule.orgId`.
 */
export async function getStudentAttendances(studentId: string, orgId: string) {
  return prisma.attendance.findMany({
    where: { studentId, deletedAt: null, schedule: { orgId } },
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
 * Attendance n'a pas d'orgId → scope relationnel via `schedule.orgId`.
 */
export async function getUserAttendance(
  studentId: string,
  scheduleId: string,
  orgId: string,
) {
  return prisma.attendance.findFirst({
    where: { studentId, scheduleId, deletedAt: null, schedule: { orgId } },
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
 * Comptes de présence par statut pour un étudiant (taux non borné — D4).
 * Le calcul du taux (numérateur/dénominateur) reste chez le consommateur via `policy.ts`.
 * `range` (optionnel) borne sur `schedule.startTime` — ex. comptes du jour.
 */
export async function getStudentAttendanceStatusCounts(
  studentId: string,
  orgId: string,
  range?: { start: Date; end: Date },
): Promise<Record<AttendanceStatus, number>> {
  const rows = await prisma.attendance.groupBy({
    by: ["status"],
    where: {
      studentId,
      deletedAt: null,
      schedule: {
        orgId,
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
    counts[row.status] = row._count._all;
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
): Promise<Record<string, { rate: number | null; absences: number; denominator: number }>> {
  const rows = await prisma.attendance.groupBy({
    by: ["studentId", "status"],
    where: { deletedAt: null, schedule: { orgId } },
    _count: { _all: true },
  });

  const num = new Set<AttendanceStatus>(ATTENDANCE_NUMERATOR_STATUSES);
  const den = new Set<AttendanceStatus>(ATTENDANCE_DENOMINATOR_STATUSES);

  const acc: Record<string, { numerator: number; denominator: number; absences: number }> = {};
  for (const r of rows) {
    const e = (acc[r.studentId] ??= { numerator: 0, denominator: 0, absences: 0 });
    const n = r._count._all;
    if (num.has(r.status)) e.numerator += n;
    if (den.has(r.status)) e.denominator += n;
    if (r.status === "ABSENT") e.absences += n;
  }

  const result: Record<string, { rate: number | null; absences: number; denominator: number }> = {};
  for (const [studentId, e] of Object.entries(acc)) {
    result[studentId] = {
      rate: e.denominator > 0 ? Math.round((e.numerator / e.denominator) * 100) : null,
      absences: e.absences,
      denominator: e.denominator,
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
    getStudentAttendances(studentId, orgId),
  ]);

  const sum = (statuses: readonly AttendanceStatus[]) =>
    statuses.reduce((acc, st) => acc + (counts[st] ?? 0), 0);
  const numerator = sum(ATTENDANCE_NUMERATOR_STATUSES);
  const denominator = sum(ATTENDANCE_DENOMINATOR_STATUSES);
  const rate = denominator > 0 ? Math.round((numerator / denominator) * 100) : null;

  return {
    rate,
    absences: counts.ABSENT ?? 0,
    recentAbsences: attendances.filter((a) => a.status === "ABSENT").slice(0, 5),
  };
}

import { Prisma } from "@/generated/prisma/client";
import { activeEnrollmentWhere, activeGroupMemberWhere } from "./filter";

/**
 * Étudiants attendus à un schedule (identités, pour créer des Attendance).
 *  - groupId présent → membres du groupe (via StudentGroup → enrollment)
 *  - groupId absent  → tous les inscrits actifs de la classe
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
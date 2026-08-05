// src/services/attendance/database/analytics.ts
// Agrégations/statistiques de présence (lectures Prisma, pas d'auth).
import { startOfDay, endOfDay } from "date-fns";

import { prisma } from "@/lib/prisma";
import {
  ATTENDANCE_NUMERATOR_STATUSES,
  ATTENDANCE_DENOMINATOR_STATUSES,
} from "../policy";

/**
 * Absences (status ABSENT) du jour pour l'org — liste pour le pilotage direction.
 * Attendance n'a pas d'orgId → scope relationnel via `schedule.orgId`.
 */
export async function getOrgTodayAbsences(orgId: string) {
  const now = new Date();
  return prisma.attendance.findMany({
    where: {
      status: "ABSENT",
      schedule: {
        orgId,
        deletedAt: null,
        startTime: { gte: startOfDay(now), lte: endOfDay(now) },
      },
    },
    select: {
      id: true,
      student: {
        select: { user: { select: { firstName: true, lastName: true } } },
      },
      schedule: {
        select: {
          startTime: true,
          course: { select: { name: true } },
          class: { select: { name: true } },
          group: { select: { name: true } },
        },
      },
    },
    orderBy: { schedule: { startTime: "asc" } },
    take: 50,
  });
}

/**
 * Taux d'assiduité des étudiants d'une classe (hors PENDING, séances COMPLETED).
 * `getClassAttendanceRates(classId, orgId, courseId?)` → Map<studentId, taux %>.
 * Scope orgId via la relation `schedule.orgId`.
 */
export async function getClassAttendanceRates(
  classId: string,
  orgId: string,
  courseId?: string,
) {
  const rows = await prisma.attendance.groupBy({
    by: ["studentId", "status"],
    where: {
      schedule: {
        classId,
        orgId,
        deletedAt: null,
        ...(courseId ? { courseId } : {}),
        session: { status: "COMPLETED" },
      },
    },
    _count: { status: true },
  });

  const byStudent = new Map<string, Record<string, number>>();
  for (const row of rows) {
    if (!byStudent.has(row.studentId)) byStudent.set(row.studentId, {});
    byStudent.get(row.studentId)![row.status] = (row._count as { status: number }).status;
  }

  const result = new Map<string, number>();
  for (const [studentId, counts] of byStudent) {
    const num = ATTENDANCE_NUMERATOR_STATUSES.reduce(
      (acc, s) => acc + (counts[s] ?? 0),
      0,
    );
    const den = ATTENDANCE_DENOMINATOR_STATUSES.reduce(
      (acc, s) => acc + (counts[s] ?? 0),
      0,
    );
    result.set(studentId, den > 0 ? Math.round((num / den) * 100) : 100);
  }
  return result;
}

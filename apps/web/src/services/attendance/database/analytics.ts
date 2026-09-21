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

/**
 * Rapport d'assiduité par étudiant pour la Direction.
 * Filtre optionnel par classId et/ou plage de dates.
 * Trié par taux ASC (plus à risque en premier).
 */
export async function getAttendanceReport(
  orgId: string,
  opts: { classId?: string; startDate?: Date; endDate?: Date } = {},
) {
  const scheduleWhere = {
    orgId,
    deletedAt: null as null,
    ...(opts.classId ? { classId: opts.classId } : {}),
    ...(opts.startDate || opts.endDate
      ? {
          startTime: {
            ...(opts.startDate ? { gte: opts.startDate } : {}),
            ...(opts.endDate ? { lte: opts.endDate } : {}),
          },
        }
      : {}),
    session: { status: 'COMPLETED' as const },
  }

  const rows = await prisma.attendance.groupBy({
    by: ['studentId', 'status'],
    where: { schedule: scheduleWhere },
    _count: { _all: true },
  })

  if (rows.length === 0) return []

  const numSet: Set<typeof rows[number]['status']> = new Set(ATTENDANCE_NUMERATOR_STATUSES)
  const denSet: Set<typeof rows[number]['status']> = new Set(ATTENDANCE_DENOMINATOR_STATUSES)

  const acc: Record<string, { numerator: number; denominator: number; absences: number }> = {}
  for (const r of rows) {
    const e = (acc[r.studentId] ??= { numerator: 0, denominator: 0, absences: 0 })
    const n = r._count._all
    if (numSet.has(r.status)) e.numerator += n
    if (denSet.has(r.status)) e.denominator += n
    if (r.status === 'ABSENT') e.absences += n
  }

  const studentIds = Object.keys(acc)
  const enrollments = await prisma.studentEnrollment.findMany({
    where: {
      studentId: { in: studentIds },
      endedAt: null,
      ...(opts.classId ? { classId: opts.classId } : {}),
      class: { programTrack: { orgId } },
    },
    select: {
      studentId: true,
      classId: true,
      class: { select: { name: true } },
      student: { select: { user: { select: { firstName: true, lastName: true } } } },
    },
  })

  const enrollmentMap = new Map(enrollments.map((e) => [e.studentId, e]))

  return studentIds
    .map((studentId) => {
      const e = acc[studentId]
      const enr = enrollmentMap.get(studentId)
      return {
        studentId,
        firstName:   enr?.student.user.firstName ?? null,
        lastName:    enr?.student.user.lastName ?? null,
        classId:     enr?.classId ?? null,
        className:   enr?.class.name ?? null,
        absences:    e.absences,
        denominator: e.denominator,
        rate: e.denominator > 0 ? Math.round((e.numerator / e.denominator) * 100) : null,
      }
    })
    .sort((a, b) => (a.rate ?? 100) - (b.rate ?? 100))
}



// ⚠ AJOUTS à fusionner dans src/services/attendance/database/analytics.ts
// Imports à dédupliquer avec ceux du fichier existant (prisma, date-fns, ../policy).
import { startOfWeek, subDays } from "date-fns";

import type { AttendanceStatus } from "@/generated/prisma/browser";
import {
  isAbsenteeism,
} from "../policy";
import { ABSENTEEISM_LIST_LIMIT, RECENT_SESSIONS_LIMIT } from "../constants";

// ─── Vue d'ensemble enseignant ───────────────────────────────────────────────

type StatusCounts = Record<AttendanceStatus, number>;

type Bucket<Meta> = {
  meta: Meta;
  counts: StatusCounts;
  scheduleIds: Set<string>;
};

const emptyCounts = (): StatusCounts => ({
  PRESENT: 0,
  ABSENT: 0,
  LATE: 0,
  EXCUSED: 0,
  PENDING: 0,
});

const sum = (counts: StatusCounts, statuses: readonly AttendanceStatus[]) =>
  statuses.reduce((acc, status) => acc + counts[status], 0);

// Taux selon policy.ts : numérateur PRESENT + LATE, dénominateur
// PRESENT + LATE + ABSENT + EXCUSED (PENDING exclu), pourcentage entier.
function summarize(counts: StatusCounts) {
  const numerator = sum(counts, ATTENDANCE_NUMERATOR_STATUSES);
  const denominator = sum(counts, ATTENDANCE_DENOMINATOR_STATUSES);
  return {
    present: counts.PRESENT,
    late: counts.LATE,
    absent: counts.ABSENT,
    excused: counts.EXCUSED,
    denominator,
    rate: denominator > 0 ? Math.round((numerator / denominator) * 100) : null,
  };
}

function addToBucket<Meta>(
  buckets: Map<string, Bucket<Meta>>,
  key: string,
  meta: Meta,
  scheduleId: string,
  status: AttendanceStatus,
) {
  const bucket = buckets.get(key) ?? { meta, counts: emptyCounts(), scheduleIds: new Set<string>() };
  bucket.counts[status]++;
  bucket.scheduleIds.add(scheduleId);
  buckets.set(key, bucket);
}

/**
 * Vue globale des présences aux séances d'un enseignant : totaux, taux par
 * cours, tendance hebdomadaire, étudiants en absentéisme, dernières séances.
 * Séances effectives uniquement (Session COMPLETED, cf. policy.ts) : après
 * clôture il n'y a plus de PENDING, donc pas de compteur « à confirmer » ici.
 * Une seule lecture agrégée en mémoire (la semaine et le cours ne sont pas
 * groupables en groupBy Prisma) : le volume d'un enseignant reste faible.
 * `sinceDays` borne sur `schedule.startTime` (undefined = tout).
 * Scope orgId via `schedule.orgId`, comme le reste du service.
 * Caché : tag liste `CACHE.ATTENDANCES(orgId)`, à invalider par les mutations
 * qui changent une présence ou clôturent une séance.
 */
export async function getTeacherAttendanceOverview(
  userId: string,
  orgId: string,
  sinceDays?: number,
) {
  // "use cache";
  // cacheTag(CACHE.ATTENDANCES(orgId));
  // cacheLife("minutes");

  const rows = await prisma.attendance.findMany({
    where: {
      schedule: {
        orgId,
        deletedAt: null,
        teacher: { userId },
        session: { status: "COMPLETED" },
        startTime:
          sinceDays === undefined
            ? undefined
            : { gte: startOfDay(subDays(new Date(), sinceDays)) },
      },
    },
    select: {
      status: true,
      studentId: true,
      scheduleId: true,
      student: { select: { user: { select: { firstName: true, lastName: true } } } },
      schedule: {
        select: {
          startTime: true,
          course: { select: { id: true, name: true } },
          class: { select: { id: true, name: true } },
        },
      },
    },
  });

  const totals = emptyCounts();
  const allScheduleIds = new Set<string>();
  const byCourse = new Map<string, Bucket<{ courseId: string; courseName: string; classId: string; className: string }>>();
  const byWeek = new Map<string, Bucket<{ weekStart: Date }>>();
  const byStudent = new Map<string, Bucket<{ studentId: string; firstName: string | null; lastName: string | null }>>();
  const bySchedule = new Map<string, Bucket<{ scheduleId: string; courseName: string; className: string; startTime: Date }>>();

  for (const { status, studentId, scheduleId, student, schedule } of rows) {
    const { startTime, course, class: class_ } = schedule;
    const weekStart = startOfWeek(startTime, { weekStartsOn: 1 });

    totals[status]++;
    allScheduleIds.add(scheduleId);

    addToBucket(
      byCourse,
      `${course.id}:${class_.id}`,
      { courseId: course.id, courseName: course.name, classId: class_.id, className: class_.name },
      scheduleId,
      status,
    );
    addToBucket(byWeek, weekStart.toISOString(), { weekStart }, scheduleId, status);
    addToBucket(
      byStudent,
      studentId,
      { studentId, firstName: student.user.firstName, lastName: student.user.lastName },
      scheduleId,
      status,
    );
    addToBucket(
      bySchedule,
      scheduleId,
      { scheduleId, courseName: course.name, className: class_.name, startTime },
      scheduleId,
      status,
    );
  }

  return {
    totals: { sessions: allScheduleIds.size, ...summarize(totals) },

    byCourse: [...byCourse.values()]
      .map(({ meta, counts, scheduleIds }) => ({ ...meta, sessions: scheduleIds.size, ...summarize(counts) }))
      .sort((a, b) => a.courseName.localeCompare(b.courseName, "fr")),

    trend: [...byWeek.values()]
      .map(({ meta, counts, scheduleIds }) => ({ ...meta, sessions: scheduleIds.size, ...summarize(counts) }))
      .sort((a, b) => a.weekStart.getTime() - b.weekStart.getTime()),

    // Même règle que la direction (isAbsenteeism), mais calculée sur les
    // séances de cet enseignant uniquement.
    absentees: [...byStudent.values()]
      .map(({ meta, counts }) => ({ ...meta, ...summarize(counts) }))
      .filter(isAbsenteeism)
      .sort((a, b) => (a.rate ?? 100) - (b.rate ?? 100))
      .slice(0, ABSENTEEISM_LIST_LIMIT),

    recentSessions: [...bySchedule.values()]
      .map(({ meta, counts }) => ({ ...meta, ...summarize(counts) }))
      .sort((a, b) => b.startTime.getTime() - a.startTime.getTime())
      .slice(0, RECENT_SESSIONS_LIMIT),
  };
}
// src/services/parent/database/parent.overview.ts
//
// Composition multi-enfants pour le HUB /parent (vue de supervision).
// Fonction de fusion LÉGITIME (SERVICE_CONTEXT) : elle agrège plusieurs domaines
// (student/session/attendance/schedule) sur plusieurs enfants, valeur propre.
// Elle ne réécrit AUCUNE query Prisma d'un autre domaine : elle compose les owners.
//
// Pas d'empilement dans getParentStudents (identité, cache CACHE.PARENT) : rythmes
// d'invalidation différents (identité = rare ; présence/session = fréquent).

import { startOfMonth } from "date-fns";

import {
  ATTENDANCE_NUMERATOR_STATUSES,
  ATTENDANCE_DENOMINATOR_STATUSES,
} from "@/services/attendance/policy";
import { getStudentAttendanceStatusCounts } from "@/services/attendance/database";
import {
  getStudentProfile,
  getStudentSchedules,
  getStudentActiveSession,
} from "@/services/student/database";

import { getParentStudents } from "./parent.queries";
import { ageFromDateOfBirth } from "../utils";
import type { ParentChildOverview, ParentOverview } from "../types";

type OverviewData = Omit<ParentOverview, "header">;

/** Compose la vue de supervision : par enfant + agrégats (métriques + bandeau). */
export async function getParentOverview(
  parentId: string,
  orgId: string,
): Promise<OverviewData> {
  const students = await getParentStudents(parentId, orgId);
  const now = new Date();
  const monthStart = startOfMonth(now);

  const children = await Promise.all(
    students.map((student) =>
      buildChildOverview({ student, orgId, now, monthStart }),
    ),
  );

  // Agrégation en mémoire — pas en SQL (intra-établissement, cf. §1).
  const rated = children.filter((c) => c.attendanceRate > 0);
  const attendanceRate =
    rated.length > 0
      ? Math.round(
          rated.reduce((acc, c) => acc + c.attendanceRate, 0) / rated.length,
        )
      : 0;

  const monthAbsences = children.reduce(
    (acc, c) => acc + (c.__monthAbsences ?? 0),
    0,
  );

  // Bandeau : premier enfant marqué absent en séance active, sinon null.
  const absentChild = children.find((c) => c.current.kind === "absent");
  const alert = absentChild
    ? {
        studentId: absentChild.studentId,
        message: `${childName(absentChild)} est porté absent${
          absentChild.current.courseName
            ? ` en ${absentChild.current.courseName}`
            : ""
        }.`,
      }
    : null;

  return {
    metrics: {
      attendanceRate,
      pendingCount: 0, // Phase 2 (file d'actions) — compteur seul au MVP.
      monthAbsences,
    },
    alert,
    children: children.map(stripInternal),
  };
}

type ChildWithInternal = ParentChildOverview & { __monthAbsences?: number };

function childName(c: ParentChildOverview): string {
  return [c.firstName, c.lastName].filter(Boolean).join(" ") || "L'enfant";
}

function stripInternal(c: ChildWithInternal): ParentChildOverview {
  const { __monthAbsences, ...rest } = c;
  return rest;
}

async function buildChildOverview(params: {
  student: Awaited<ReturnType<typeof getParentStudents>>[number];
  orgId: string;
  now: Date;
  monthStart: Date;
}): Promise<ChildWithInternal> {
  const { student, orgId, now } = params;

  const base = {
    studentId: student.studentId,
    firstName: student.firstName,
    lastName: student.lastName,
    avatarUrl: student.avatarUrl,
    className: student.className,
    age: ageFromDateOfBirth(student.dateOfBirth, now),
  };

  // Contexte enfant via l'owner student (source unique de classId/groupIds).
  const profile = await getStudentProfile(student.studentId, orgId);
  const classId = profile?.classId ?? null;
  const groupIds = profile?.groupIds ?? [];

  if (!classId) {
    return {
      ...base,
      current: { kind: "idle", courseName: null },
      nextCourse: null,
      dayProgress: { done: 0, total: 0 },
      attendanceRate: 0,
      __monthAbsences: 0,
    };
  }

  const dayStart = new Date(now);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(now);
  dayEnd.setHours(23, 59, 59, 999);

  const [activeSession, todaySchedules, counts] = await Promise.all([
    getStudentActiveSession({
      studentId: student.studentId,
      orgId,
      classId,
      groupIds,
    }),
    getStudentSchedules(groupIds, {
      orgId,
      classId,
      rangeStart: dayStart,
      rangeEnd: dayEnd,
    }),
    getStudentAttendanceStatusCounts(student.studentId, orgId),
  ]);

  // Statut courant : séance active prioritaire ; PENDING => "en cours" (jamais absent).
  let current: ParentChildOverview["current"] = {
    kind: "idle",
    courseName: null,
  };
  if (activeSession) {
    const att = activeSession.myAttendance?.status ?? null;
    current = {
      kind: att === "ABSENT" ? "absent" : "ongoing",
      courseName: activeSession.course,
    };
  }

  // Prochain cours du jour (non annulé/reporté, après maintenant).
  const nowMs = now.getTime();
  const upcoming = todaySchedules
    .filter(
      (s) =>
        s.status !== "CANCELED" &&
        s.startTime.getTime() > nowMs,
    )
    .sort((a, b) => a.startTime.getTime() - b.startTime.getTime())[0];
  const nextCourse = upcoming
    ? { startTime: upcoming.startTime, courseName: upcoming.course.name }
    : null;

  // Progression du jour : COMPLETED / total non annulé.
  const dayTotal = todaySchedules.filter((s) => s.status !== "CANCELED").length;
  const dayDone = todaySchedules.filter((s) => s.status === "COMPLETED").length;

  // Taux de présence hors PENDING (policy partagée).
  const sum = (statuses: readonly (keyof typeof counts)[]) =>
    statuses.reduce((acc, st) => acc + (counts[st] ?? 0), 0);
  const numerator = sum(ATTENDANCE_NUMERATOR_STATUSES);
  const denominator = sum(ATTENDANCE_DENOMINATOR_STATUSES);
  const attendanceRate =
    denominator > 0 ? Math.round((numerator / denominator) * 100) : 0;

  return {
    ...base,
    current,
    nextCourse,
    dayProgress: { done: dayDone, total: dayTotal },
    attendanceRate,
    // approximation MVP : absences cumulées (pas de query mensuelle dédiée).
    __monthAbsences: counts.ABSENT ?? 0,
  };
}

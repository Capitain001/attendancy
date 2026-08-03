// src/hooks/direction/students/useStudentsMetrics.ts
"use client";

import { useMemo } from "react";

import type { StudentRow } from "@/components/direction/students/ui/studentDirectory.helpers";
import { isAbsenteeism } from "@/services/attendance/policy";
import type { getOrgStudentAttendanceRates } from "@/services/attendance/database";

type AttendanceRates = Awaited<ReturnType<typeof getOrgStudentAttendanceRates>>;

/**
 * Préoccupation unique : KPI agrégés affichés en tête d'annuaire.
 */
export function useStudentsMetrics({
  students,
  attendanceRates,
}: {
  students: StudentRow[];
  attendanceRates: AttendanceRates;
}) {
  return useMemo(
    () => ({
      active: students.filter((s) => s.status === "ACTIVE").length,
      withoutClass: students.filter((s) => s.className == null).length,
      disabled: students.filter((s) => s.status !== "ACTIVE").length,
      absenteeism: students.filter((s) =>
        isAbsenteeism(attendanceRates[s.id] ?? { rate: null, denominator: 0 }),
      ).length,
    }),
    [students, attendanceRates],
  );
}

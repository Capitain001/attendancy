"use client";

import { useMemo } from "react";
import { useStudents } from "../student/useStudents";
import { useClassEnrollments } from "./useClassEnrollments";
import { excludeByIds } from "@/lib/filter";

/** Étudiants de l'org non inscrits activement dans la classe (liste complète, sans recherche). */
export function useAvailableStudents(classId: string) {
  const students = useStudents();
  const enrollments = useClassEnrollments(classId);

  const available = useMemo(
    () => excludeByIds(students.students, enrollments.enrollments.map((e) => e.studentId)),
    [students.students, enrollments.enrollments],
  );

  return {
    available,
    isLoading: students.isLoading || enrollments.isLoading,
    error: students.error ?? enrollments.error ?? null,
  };
}
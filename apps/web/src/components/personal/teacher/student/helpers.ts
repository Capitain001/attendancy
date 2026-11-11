// src/components/personal/teacher/student/helpers.ts
import { excludeByIds } from "@/lib/filter";
import { getFullName } from "@/lib/utils";
import type { ClassEnrollment, StudentUser } from "./types";

/** studentIds déjà dans le groupe du cours. */
export function getEnrolledStudentIds(
  enrollments: readonly ClassEnrollment[],
  groupId: string | null | undefined,
): string[] {
  if (!groupId) return [];
  return enrollments
    .filter((e) => e.studentGroups.some((sg) => sg.group.id === groupId))
    .map((e) => e.student.id);
}

/** Étudiants de la classe pas encore dans le cours. */
export function getCandidates(
  enrollments: readonly ClassEnrollment[],
  groupId: string | null | undefined,
): ClassEnrollment[] {
  return excludeByIds(
    enrollments,
    getEnrolledStudentIds(enrollments, groupId),
    (e) => e.student.id,
  );
}

export function getStudentName(user: StudentUser): string {
  return getFullName(user.firstName, user.lastName) ?? user.email;
}
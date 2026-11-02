import { excludeByIds } from "@/lib/filter";
import { getFullName } from "@/lib/utils";
import type { StudentEnrollmentsItem, UserType } from "@/services/student-enrollment";

/** studentIds déjà dans le groupe du cours. */
export function getEnrolledStudentIds(
  enrollments: readonly StudentEnrollmentsItem[],
  groupId: string | null | undefined,
): string[] {
  if (!groupId) return [];
  return enrollments
    .filter((e) => e.studentGroups.some((sg) => sg.group.id === groupId))
    .map((e) => e.student.id);
}

/** Inscriptions de la classe dont l'étudiant n'est pas encore dans le cours. */
export function getAvailableEnrollments(
  enrollments: readonly StudentEnrollmentsItem[],
  groupId: string | null | undefined,
) {
  return excludeByIds(
    enrollments,
    getEnrolledStudentIds(enrollments, groupId),
    (e) => e.student.id,
  );
}

export function getStudentName(user: UserType): string {
  return getFullName(user.firstName, user.lastName) ?? user.email;
}
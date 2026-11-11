// src/components/personal/teacher/utils.ts
import { excludeByIds } from "@/lib/filter";
import { getFullName } from "@/lib/utils";
import type { StudentEnrollmentsItem, UserType } from "@/services/student-enrollment";
import {
  resolveInvitationUiStatus,
  type DBInvitation,
} from "@/modules/invitation/policy";

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


export type AvatarUser = Pick<UserType, "firstName" | "lastName" | "email" | "avatar_url">;

export function getStudentName(user: Pick<UserType, "firstName" | "lastName" | "email">): string {
  return getFullName(user.firstName, user.lastName) ?? user.email;
}

export const normalizeEmail = (email: string) => email.trim().toLowerCase();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const isValidEmail = (email: string) => EMAIL_RE.test(email);

/** Découpe un texte collé (espaces, virgules, points-virgules, retours ligne). */
export function parseEmails(raw: string): string[] {
  return raw.split(/[\s,;]+/).map(normalizeEmail).filter(Boolean);
}

/** Même policy que le serveur : statut PENDING non expiré. */
export function isInvitationPending(
  inv: DBInvitation,
  now: Date = new Date(),
): boolean {
  return resolveInvitationUiStatus(inv, now) === "PENDING";
}
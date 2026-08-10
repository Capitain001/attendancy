// src/services/parent/utils.ts
//
// Logique pure — mapper de statut "vu côté parent". Testable hors UI.
//
// Règle produit clé : en session ACTIVE, un Attendance PENDING signifie que
// l'enfant a scanné / été enregistré — c'est le signal le plus fiable de
// présence physique en attente de validation prof. On l'affiche donc "En cours",
// jamais "absent". Voir ATTENDANCE_CONTEXT.md / policy.ts.

import type { AttendanceStatus, SessionStatus } from "@prisma/client";

export type ParentStatusInput = {
  courseName?: string | null;
  sessionStatus?: SessionStatus | null;
  attendanceStatus?: AttendanceStatus | null;
  nextScheduleStart?: Date | null;
  formatTime: (date: Date) => string;
};

export type ParentStatusKind =
  | "active"
  | "absent"
  | "present"
  | "late"
  | "excused"
  | "waiting-scan"
  | "completed"
  | "upcoming"
  | "empty";

export type ParentStatus = { kind: ParentStatusKind; label: string };

export function getParentCourseStatus(input: ParentStatusInput): ParentStatus {
  const course = input.courseName ?? "cours";

  if (input.sessionStatus === "ACTIVE") {
    if (input.attendanceStatus === "PENDING") {
      return { kind: "active", label: `En cours - ${course}` };
    }
    if (input.attendanceStatus === "ABSENT") {
      return { kind: "absent", label: `Absent - ${course}` };
    }
    if (input.attendanceStatus === "PRESENT") {
      return { kind: "present", label: `Présent - ${course}` };
    }
    if (input.attendanceStatus === "LATE") {
      return { kind: "late", label: `En retard - ${course}` };
    }
    if (input.attendanceStatus === "EXCUSED") {
      return { kind: "excused", label: `Excusé - ${course}` };
    }
    return { kind: "waiting-scan", label: "En attente de scan" };
  }

  if (
    input.sessionStatus === "COMPLETED" &&
    input.attendanceStatus === "PRESENT"
  ) {
    return { kind: "completed", label: "Présent - cours terminé" };
  }

  if (input.nextScheduleStart) {
    return {
      kind: "upcoming",
      label: `Cours prévu à ${input.formatTime(input.nextScheduleStart)}`,
    };
  }

  return { kind: "empty", label: "Aucun cours en cours" };
}

/** Âge en années pleines, dérivé de dateOfBirth (null si absent). */
export function ageFromDateOfBirth(
  dateOfBirth: Date | null | undefined,
  now: Date = new Date(),
): number | null {
  if (!dateOfBirth) return null;
  let age = now.getFullYear() - dateOfBirth.getFullYear();
  const m = now.getMonth() - dateOfBirth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < dateOfBirth.getDate())) age--;
  return age >= 0 ? age : null;
}

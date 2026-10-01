// src/services/attendance/actions/fiche.ts
"use server";

import { ERRORS } from "@/config";
import { authAccess } from "@/services/auth";
import { mockGetTeacherAttendanceFicheProps } from "@/data/mocks/mock.teacher-attendance-fiche";

/**
 * Données de la fiche de présence enseignant (TeacherAttendanceFiche).
 * L'enseignant est déduit du token : pas d'id enseignant en paramètre.
 * ⚠ Point d'extension : retourne actuellement le mock dédié
 * (`mockGetTeacherAttendanceFicheProps`) — à remplacer par les lectures
 * database/ réelles (overview + séances du jour + justificatifs).
 */
export async function getTeacherAttendanceFicheAction() {
  const auth = await authAccess({ requiredRole: "TEACHER" });
  if (!auth.data) return { error: auth.error };

  try {
    return { data: mockGetTeacherAttendanceFicheProps() };
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER };
  }
}

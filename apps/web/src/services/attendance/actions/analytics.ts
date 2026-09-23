// src/services/attendance/actions/analytics.ts
"use server";

import { ERRORS } from "@/config";
import { authAccess } from "@/services/auth";
import { getClassAttendanceRates, getOrgTodayAbsences } from "../database";

/**
 * Taux d'assiduité des étudiants d'une classe (détail classe direction).
 * `classId` = donnée métier (prop appelant) ; `orgId` = contexte auth.
 * Retour : Map<studentId, taux %> (hors PENDING, séances COMPLETED).
 */
export async function getClassAttendanceRatesAction({
  classId,
  courseId,
}: {
  classId: string;
  courseId?: string;
}) {
  try {
    const auth = await authAccess({ requiredRole: ["DIRECTION", "ADMIN"] });
    if (!auth.data) return { error: auth.error };
    const { orgId } = auth.data;

    const data = await getClassAttendanceRates(classId, orgId, courseId);
    return { data };
  } catch (error) {
    console.error("[getClassAttendanceRatesAction]", error);
    return { error: error instanceof Error ? error.message : ERRORS.SERVER };
  }
}

/**
 * Liste des absences (ABSENT) du jour de l'org  pilotage direction (P-41).
 * Garde DIRECTION/ADMIN ; scope orgId via `schedule.orgId`.
 */
export async function getOrgTodayAbsencesAction() {
  try {
    const auth = await authAccess({ requiredRole: ["DIRECTION", "ADMIN"] });
    if (!auth.data) return { error: auth.error };
    const { orgId } = auth.data;

    const data = await getOrgTodayAbsences(orgId);
    return { data };
  } catch (error) {
    console.error("[getOrgTodayAbsencesAction]", error);
    return { error: error instanceof Error ? error.message : ERRORS.SERVER };
  }
}


// ⚠ AJOUTS à fusionner dans src/services/attendance/actions/analytics.ts
// ('use server' déjà présent en tête du fichier ; dédupliquer les imports).

import { getTeacherAttendanceOverview } from '../database'
import { mockGetTeacherAttendanceOverview } from "@/data/mocks/mock.attendance";

// L'enseignant est déduit du token : jamais d'id enseignant en paramètre.
export async function getTeacherAttendanceOverviewAction() {
  const auth = await authAccess({ requiredRole: 'TEACHER' })
  if (!auth.data) return { error: auth.error }
  const { user, orgId } = auth.data
 
  try {
    const overview = await getTeacherAttendanceOverview(user.id, orgId)
        return { data: mockGetTeacherAttendanceOverview() }
    return { data: overview }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}
 
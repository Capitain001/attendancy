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

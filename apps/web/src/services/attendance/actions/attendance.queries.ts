// src/services/attendance/actions/attendance.queries.ts
"use server";

import { ERRORS } from "@/config";
import { authAccess } from "@/services/auth";
import {
  getScheduleAttendances,
  getStudentAttendances,
  getStudentAttendanceSummary,
  getOrgStudentAttendanceRates,
  getAttendanceReport,
} from "../database";

/** Historique de présence de l'étudiant courant (lecture de son propre dossier). */
export async function getStudentAttendancesAction() {
  try {
    const auth = await authAccess();
    if (!auth.data) return { error: auth.error };
    const { orgId, user } = auth.data;

    const studentId = user.organization?.studentId;
    if (!studentId) return { error: "Profil étudiant introuvable" };

    const data = await getStudentAttendances(studentId, orgId);
    return { data };
  } catch (error) {
    console.error("[getStudentAttendancesAction]", error);
    return { error: error instanceof Error ? error.message : ERRORS.SERVER };
  }
}

/**
 * Résumé d'assiduité d'un étudiant pour la direction (fiche admin).
 * `studentId` = donnée métier (prop appelant) ; `orgId` = contexte auth.
 */
export async function getStudentAttendanceSummaryAction(studentId: string) {
  try {
    const auth = await authAccess({ requiredRole: ["DIRECTION", "ADMIN"] });
    if (!auth.data) return { error: auth.error };
    const { orgId } = auth.data;

    const data = await getStudentAttendanceSummary(studentId, orgId);
    return { data };
  } catch (error) {
    console.error("[getStudentAttendanceSummaryAction]", error);
    return { error: error instanceof Error ? error.message : ERRORS.SERVER };
  }
}

/**
 * Taux d'assiduité de tous les étudiants de l'org (annuaire direction, P-23).
 * Garde DIRECTION. Indexé par studentId.
 */
export async function getOrgStudentAttendanceRatesAction() {
  try {
    const auth = await authAccess({ requiredRole: ["DIRECTION", "ADMIN"] });
    if (!auth.data) return { error: auth.error };
    const { orgId } = auth.data;

    const data = await getOrgStudentAttendanceRates(orgId);
    return { data };
  } catch (error) {
    console.error("[getOrgStudentAttendanceRatesAction]", error);
    return { error: error instanceof Error ? error.message : ERRORS.SERVER };
  }
}

export async function getAttendanceReportAction(params: {
  classId?: string
  startDate?: Date
  endDate?: Date
} = {}) {
  try {
    const auth = await authAccess({ requiredRole: ['DIRECTION', 'ADMIN'] })
    if (!auth.data) return { error: auth.error }
    const { orgId } = auth.data
    const data = await getAttendanceReport(orgId, params)
    return { data }
  } catch (error) {
    console.error('[getAttendanceReportAction]', error)
    return { error: error instanceof Error ? error.message : ERRORS.SERVER }
  }
}

export async function getScheduleAttendancesAction({ scheduleId }: { scheduleId: string }) {
  try {
    const auth = await authAccess({ requiredRole: ["TEACHER", "DIRECTION"] });
    if (!auth.data) return { error: auth.error };

    const data = await getScheduleAttendances(scheduleId);
    return { data };
  } catch (error) {
    console.error("[getScheduleAttendancesAction]", error);
    return { error: error instanceof Error ? error.message : ERRORS.SERVER };
  }
}
// src/services/parent/actions.ts
"use server";

import * as v from "valibot";

import { ERRORS } from "@/config";
import { authAccess } from "@/services/auth";
import {
  getStudentProfile,
  getStudentStats,
  getStudentSchedules,
  getStudentActiveSession,
  getStudentSessionDetail,
} from "@/services/student/database";
import { getStudentAttendances } from "@/services/attendance/database";

import {
  getParentStudents,
  getParentOverview,
  isStudentParent,
  searchEligibleParents,
  createParentRelationWithAudit,
  deleteParentRelationWithAudit,
} from "./database";
import {
  createParentRelationSchema,
  deleteParentRelationSchema,
  searchParentsSchema,
} from "./validation";

const ACCESS_DENIED = "Accès refusé";

/**
 * Contexte auth parent UNIQUEMENT : { parentId, orgId }.
 * Vérifie que l'utilisateur authentifié a un profil parent.
 */
async function getParentAuth() {
  const auth = await authAccess();
  if (!auth.data) throw new Error(auth.error);
  const { user, orgId } = auth.data;

  // On suppose que l'utilisateur a un champ parentId (ou function === 'PARENT')
  // Adaptez selon votre modèle
  const parentId = (user as any).parentId; // à typer correctement
  if (!parentId) throw new Error("Profil parent introuvable");
  if (!orgId) throw new Error(ERRORS.ORG.NOT_FOUND);
  return { parentId, orgId };
}

// ─── Lectures (scope parent) ────────────────────────────────────────────────

export async function getParentStudentsAction() {
  try {
    const { parentId, orgId } = await getParentAuth();
    const data = await getParentStudents(parentId, orgId);
    return { data };
  } catch (error) {
    console.error("[getParentStudentsAction]", error);
    return { error: error instanceof Error ? error.message : ERRORS.SERVER };
  }
}

export async function getParentOverviewAction() {
  try {
    const { parentId, orgId } = await getParentAuth();
    const [overview, user] = await Promise.all([
      getParentOverview(parentId, orgId),
      authAccess(), // on récupère l'utilisateur pour le header
    ]);

    const userData = user.data?.user;
    return {
      data: {
        ...overview,
        header: {
          name: userData?.name ?? null,
          avatarUrl: userData?.avatar_url ?? null,
          orgName: userData?.organization?.name ?? null,
          childrenCount: overview.children.length,
        },
      },
    };
  } catch (error) {
    console.error("[getParentOverviewAction]", error);
    return { error: error instanceof Error ? error.message : ERRORS.SERVER };
  }
}

export async function getParentDashboardAction(params: {
  studentId: string;
  classId: string | null;
  groupIds: string[];
}) {
  try {
    const { parentId, orgId } = await getParentAuth();

    if (!(await isStudentParent(parentId, params.studentId))) {
      return { error: ACCESS_DENIED };
    }

    if (!params.classId) {
      return { data: { profile: null, stats: null, activeSession: null } };
    }

    const [profile, stats, activeSession] = await Promise.all([
      getStudentProfile(params.studentId, orgId),
      getStudentStats({
        studentId: params.studentId,
        orgId,
        classId: params.classId,
        groupIds: params.groupIds,
      }),
      getStudentActiveSession({
        studentId: params.studentId,
        orgId,
        classId: params.classId,
        groupIds: params.groupIds,
      }),
    ]);

    return { data: { profile, stats, activeSession } };
  } catch (error) {
    console.error("[getParentDashboardAction]", error);
    return { error: error instanceof Error ? error.message : ERRORS.SERVER };
  }
}

export async function getParentAttendancesAction(params: { studentId: string }) {
  try {
    const { parentId, orgId } = await getParentAuth();

    if (!(await isStudentParent(parentId, params.studentId))) {
      return { error: ACCESS_DENIED };
    }

    const attendances = await getStudentAttendances(params.studentId, orgId);
    return { data: { attendances } };
  } catch (error) {
    console.error("[getParentAttendancesAction]", error);
    return { error: error instanceof Error ? error.message : ERRORS.SERVER };
  }
}

export async function getParentPlanningAction(params: {
  studentId: string;
  classId: string | null;
  groupIds: string[];
  rangeStart: Date;
  rangeEnd: Date;
}) {
  try {
    const { parentId, orgId } = await getParentAuth();

    if (!(await isStudentParent(parentId, params.studentId))) {
      return { error: ACCESS_DENIED };
    }

    if (!params.classId) {
      return { data: { schedules: [] } };
    }

    const schedules = await getStudentSchedules(params.groupIds, {
      orgId,
      classId: params.classId,
      rangeStart: params.rangeStart,
      rangeEnd: params.rangeEnd,
    });

    return { data: { schedules } };
  } catch (error) {
    console.error("[getParentPlanningAction]", error);
    return { error: error instanceof Error ? error.message : ERRORS.SERVER };
  }
}

export async function getParentSessionDetailAction(params: {
  studentId: string;
  scheduleId: string;
}) {
  try {
    const { parentId, orgId } = await getParentAuth();

    if (!(await isStudentParent(parentId, params.studentId))) {
      return { error: ACCESS_DENIED };
    }

    const profile = await getStudentProfile(params.studentId, orgId);
    if (!profile?.classId) return { error: "Aucune classe associée" };

    const data = await getStudentSessionDetail({
      studentId: params.studentId,
      scheduleId: params.scheduleId,
      orgId,
      classId: profile.classId,
      groupIds: profile.groupIds,
    });
    if (!data) return { error: "Séance introuvable" };
    return { data };
  } catch (error) {
    console.error("[getParentSessionDetailAction]", error);
    return { error: error instanceof Error ? error.message : ERRORS.SERVER };
  }
}

// ─── Mutations (direction) ──────────────────────────────────────────────────

export async function searchEligibleParentsAction(input: unknown) {
  const parsed = v.safeParse(searchParentsSchema, input);
  if (!parsed.success) {
    return { error: parsed.issues[0]?.message ?? "Données invalides" };
  }

  const auth = await authAccess({ requiredRole: "DIRECTION" });
  if (!auth.data) return { error: auth.error };
  const { orgId } = auth.data;

  try {
    const data = await searchEligibleParents({
      orgId,
      query: parsed.output.query,
      excludeStudentId: parsed.output.excludeStudentId,
    });
    return { data };
  } catch (error) {
    console.error("[searchEligibleParentsAction]", error);
    return { error: error instanceof Error ? error.message : ERRORS.SERVER };
  }
}

export async function assignParentToStudentAction(input: unknown) {
  const parsed = v.safeParse(createParentRelationSchema, input);
  if (!parsed.success) {
    return { error: parsed.issues[0]?.message ?? "Données invalides" };
  }

  const auth = await authAccess({ requiredRole: "DIRECTION" });
  if (!auth.data) return { error: auth.error };
  const { user, orgId } = auth.data;

  try {
    const data = await createParentRelationWithAudit({
      orgId,
      actorUserId: user.id,
      parentId: parsed.output.parentId,
      studentId: parsed.output.studentId,
      relation: parsed.output.relation,
    });
    return { data };
  } catch (error) {
    console.error("[assignParentToStudentAction]", error);
    return { error: error instanceof Error ? error.message : ERRORS.SERVER };
  }
}

export async function removeParentFromStudentAction(input: unknown) {
  const parsed = v.safeParse(deleteParentRelationSchema, input);
  if (!parsed.success) {
    return { error: parsed.issues[0]?.message ?? "Données invalides" };
  }

  const auth = await authAccess({ requiredRole: "DIRECTION" });
  if (!auth.data) return { error: auth.error };
  const { user, orgId } = auth.data;

  try {
    const data = await deleteParentRelationWithAudit({
      orgId,
      actorUserId: user.id,
      relationId: parsed.output.relationId,
    });
    return { data };
  } catch (error) {
    console.error("[removeParentFromStudentAction]", error);
    return { error: error instanceof Error ? error.message : ERRORS.SERVER };
  }
}

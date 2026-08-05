// src/services/attendance/actions/attendance.mutations.ts
"use server";

import { ERRORS } from "@/config";
import { authAccess } from "@/services/auth";
import {
  recordAttendance,
  confirmAttendance,
  confirmAllAttendances,
  createAttendance,
} from "../database";
import { AttendanceStatus } from "@/generated/prisma/client";
import { validateSessionToken } from "../../session/database/token.mutations";
import { sendPushNotificationById } from "@/modules/notification/action";

/**
 * Notif PRESENT à la confirmation (D20) — best-effort, hors mutation :
 * push = événement (« ta présence est validée »), jamais de stat/taux.
 */
async function notifyConfirmed(userIds: string[], scheduleId?: string) {
  if (userIds.length === 0) return;
  const results = await Promise.allSettled(
    userIds.map((userId) =>
      sendPushNotificationById(userId, {
        message: "Ta présence a été confirmée par l'enseignant.",
        type: "GENERAL",
        scheduleId,
      }),
    ),
  );
  const failed = results.filter((r) => r.status === "rejected").length;
  if (failed > 0) {
    console.warn(`[notifyConfirmed] ${failed} notif(s) PRESENT non envoyée(s)`);
  }
}

export async function createAttendanceAction({
  scheduleId,
  studentId,
  status,
  enrollmentId,
}: {
  scheduleId: string;
  studentId: string;
  status?: AttendanceStatus;
  enrollmentId: string;
}) {
  try {
    const auth = await authAccess({ requiredRole: ["TEACHER", "DIRECTION"] });
    if (!auth.data) return { error: auth.error };
    const { orgId } = auth.data;

    const data = await createAttendance(scheduleId, studentId, enrollmentId, orgId, status);
    return { data };
  } catch (error) {
    console.error("[createAttendanceAction]", error);
    return { error: error instanceof Error ? error.message : ERRORS.SERVER };
  }
}

export async function confirmAttendanceAction({ attendanceId }: { attendanceId: string }) {
  try {
    const auth = await authAccess({ requiredRole: ["TEACHER", "DIRECTION"] });
    if (!auth.data) return { error: auth.error };

    const data = await confirmAttendance(attendanceId);
    if (data.confirmed) {
      await notifyConfirmed([data.userId]);
    }
    return { data };
  } catch (error) {
    console.error("[confirmAttendanceAction]", error);
    return { error: error instanceof Error ? error.message : ERRORS.SERVER };
  }
}

export async function confirmAllAttendancesAction({ scheduleId }: { scheduleId: string }) {
  try {
    const auth = await authAccess({ requiredRole: ["TEACHER", "DIRECTION"] });
    if (!auth.data) return { error: auth.error };

    const data = await confirmAllAttendances(scheduleId);
    await notifyConfirmed(data.userIds, scheduleId);
    return { data };
  } catch (error) {
    console.error("[confirmAllAttendancesAction]", error);
    return { error: error instanceof Error ? error.message : ERRORS.SERVER };
  }
}

export async function recordAttendanceAction(
  token: string,
  coords?: { lat: number; lng: number },
) {
  try {
    const auth = await authAccess({ requiredRole: "STUDENT" });
    if (!auth.data) return { error: auth.error };
    const { user } = auth.data;

    const studentId = user.organization?.studentId;
    if (!studentId) return { error: "Profil étudiant introuvable." };

    const { scheduleId } = await validateSessionToken(token);

    const data = await recordAttendance(scheduleId, studentId, coords);

    return { data };
  } catch (error) {
    console.error("[recordAttendanceAction]", error);
    return { error: error instanceof Error ? error.message : ERRORS.SERVER };
  }
}
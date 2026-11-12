// src/services/schedule/actions/schedule.mutations.ts
"use server";
import * as v from "valibot";
import { authAccess } from "@/services/auth";
import { ERRORS } from "@/config";
import {
  createSchedule,
  updateSchedule,
  removeSchedule,
  restoreSchedule,
  getScheduleForNotify,
  getScheduleNotificationContext,
  toggleScheduleLock,
} from "../database";
import {
  CreateScheduleOutput,
  createScheduleSchema,
  updateScheduleSchema,
  UpdateScheduleInput,
  ToggleScheduleLockInput,
  toggleScheduleLockSchema,
} from "../validation";
import { logAuditAsync } from "@/modules/audit";
import {
  INVALID_TIME_ORDER_ERROR,
  isSlotElapsed,
  isValidTimeOrder,
  PAST_SLOT_ERROR,
} from "@/services/planning/policy";
import { notifyScheduleStakeholders } from "../notifications";

const PLANNING_ROLES = "DIRECTION" as const;

export async function createScheduleAction(data: CreateScheduleOutput) {
  const auth = await authAccess({
    requiredRole: PLANNING_ROLES,
    allowPersonalOrg: true,
  });
  if (!auth.data) return { error: auth.error };
  const { orgId, user } = auth.data;

  if (!isValidTimeOrder(data.startTime, data.endTime))
    return { error: INVALID_TIME_ORDER_ERROR };
  if (isSlotElapsed({ start: data.startTime, end: data.endTime }))
    return { error: PAST_SLOT_ERROR };

  const parsed = v.safeParse(createScheduleSchema, data);
  if (!parsed.success)
    return { error: parsed.issues[0]?.message ?? "Données invalides" };

  try {
    const schedule = await createSchedule({ ...parsed.output, orgId });
    await notifyScheduleStakeholders({
      scheduleId: schedule.id,
      orgId,
      event: "CREATED",
    });

    logAuditAsync({
      userId: user.id,
      action: "CREATE",
      resource: "SCHEDULE",
      resourceId: schedule.id,
      orgId,
      details: {
        event: "SCHEDULE_CREATED",
        courseName: schedule.course?.name ?? null,
        day: schedule.startTime,
      },
    });

    return { data: schedule };
  } catch (error: unknown) {
    console.error("Erreur création schedule:", error);
    return { error: error instanceof Error ? error.message : ERRORS.SERVER };
  }
}

export async function updateScheduleAction(input: UpdateScheduleInput) {
  // const auth = await authAccess({ requiredRole: PLANNING_ROLES })
  const auth = await authAccess({
    requiredRole: "DIRECTION",
    requiredFunction: "PRINCIPAL",
    allowPersonalOrg: true,
  });
  if (!auth.data) return { error: auth.error };
  const { orgId, user } = auth.data;

  const parsed = v.safeParse(updateScheduleSchema, input);
  if (!parsed.success)
    return { error: parsed.issues[0]?.message ?? "Données invalides" };

  const scheduleId = parsed.output.scheduleId;
  const data = parsed.output.data;

  if (
    data.startTime &&
    data.endTime &&
    isSlotElapsed({ start: data.startTime, end: data.endTime })
  ) {
    return { error: PAST_SLOT_ERROR };
  }

  try {
    const before = await getScheduleNotificationContext(scheduleId, orgId);
    if (!before) return { error: "Séance introuvable." };

    const schedule = await updateSchedule(scheduleId, orgId, data);
    const notificationBefore = {
      teacherId: before.teacherId,
      confirmed: before.confirmed,
      status: before.status,
      teacherUserId: before.teacher.userId,
    };
    const event =
      data.status === "CANCELED"
        ? "CANCELED"
        : before.confirmed === false && schedule.confirmed
          ? "CONFIRMED"
          : "UPDATED";
    const significant = (
      ["roomId", "teacherId", "startTime", "endTime", "courseId"] as const
    ).some((key) => data[key] !== undefined);
    if (event !== "UPDATED" || significant) {
      await notifyScheduleStakeholders({
        scheduleId,
        orgId,
        event,
        before: notificationBefore,
      });
    }

    const canceled = data.status === "CANCELED";
    const changedFields = (
      ["roomId", "teacherId", "startTime", "endTime"] as const
    ).filter((key) => data[key] !== undefined);

    if (canceled || changedFields.length > 0) {
      logAuditAsync({
        userId: user.id,
        action: canceled ? "DELETE" : "UPDATE",
        resource: "SCHEDULE",
        resourceId: scheduleId,
        orgId,
        details: {
          event: canceled ? "SCHEDULE_CANCELED" : "SCHEDULE_UPDATED",
          courseName: schedule.course?.name ?? null,
          day: schedule.startTime,
          changes: changedFields,
        },
      });
    }

    return { data: schedule };
  } catch (error: unknown) {
    console.error("Erreur mise à jour schedule:", error);
    return { error: error instanceof Error ? error.message : ERRORS.SERVER };
  }
}

export async function cancelScheduleAction(scheduleId: string) {
  const auth = await authAccess({
    requiredRole: PLANNING_ROLES,
    allowPersonalOrg: true,
  });
  if (!auth.data) return { error: auth.error };
  const { orgId } = auth.data;

  try {
    const before = await getScheduleNotificationContext(scheduleId, orgId);
    if (!before) return { error: "Séance introuvable." };

    const schedule = await updateSchedule(scheduleId, orgId, {
      status: "CANCELED",
    });
    await notifyScheduleStakeholders({
      scheduleId: schedule.id,
      orgId,
      event: "CANCELED",
      before: {
        teacherId: before.teacherId,
        confirmed: before.confirmed,
        status: before.status,
        teacherUserId: before.teacher.userId,
      },
    });
    return { data: true as const };
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER };
  }
}

export async function removeScheduleAction(scheduleId: string) {
  const auth = await authAccess({
    requiredRole: PLANNING_ROLES,
    allowPersonalOrg: true,
  });
  if (!auth.data) return { error: auth.error };
  const { orgId, user } = auth.data;

  try {
    const snapshot = await removeSchedule(scheduleId, orgId);

    logAuditAsync({
      userId: user.id,
      action: "DELETE",
      resource: "SCHEDULE",
      resourceId: scheduleId,
      orgId,
      details: {
        event: "SCHEDULE_DELETED",
        courseName: snapshot.course?.name ?? null,
        day: snapshot.startTime,
      },
    });

    return { data: true as const };
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER };
  }
}

export async function deleteScheduleAction(scheduleId: string) {
  return removeScheduleAction(scheduleId);
}

export async function restoreScheduleAction(scheduleId: string) {
  const auth = await authAccess({
    requiredRole: PLANNING_ROLES,
    allowPersonalOrg: true,
  });
  if (!auth.data) return { error: auth.error };
  const { orgId } = auth.data;

  try {
    return { data: await restoreSchedule(scheduleId, orgId) };
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER };
  }
}

/**
 * Envoi manuel de l'annonce élèves/parents pour une séance confirmée.
 */
export async function notifyScheduleCreationAction(scheduleId: string) {
  const auth = await authAccess({
    requiredRole: PLANNING_ROLES,
    allowPersonalOrg: true,
  });
  if (!auth.data) return { error: auth.error };
  const { orgId } = auth.data;

  try {
    const schedule = await getScheduleForNotify(scheduleId, orgId);
    if (!schedule) return { error: "Séance introuvable." };
    if (!schedule.confirmed) {
      return { error: "La séance doit être confirmée avant son annonce." };
    }

    const { announced } = await notifyScheduleStakeholders({
      scheduleId,
      orgId,
      event: "CREATED",
      audience: "STUDENTS_AND_PARENTS",
    });
    if (announced) return { data: true as const };

    const currentSchedule = await getScheduleForNotify(scheduleId, orgId);
    if (!currentSchedule) return { error: "Séance introuvable." };
    return { error: "Cette séance a déjà été annoncée." };
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER };
  }
}

/**
 * Envoi MANUEL en lot des notifications de création (« Tout notifier »).
 * Renvoie le nombre de claims obtenus et les séances ignorées.
 */
export async function notifyScheduleCreationsAction(scheduleIds: string[]) {
  const auth = await authAccess({
    requiredRole: PLANNING_ROLES,
    allowPersonalOrg: true,
  });
  if (!auth.data) return { error: auth.error };
  const { orgId } = auth.data;

  let succeeded = 0;
  const skipped: Array<{
    scheduleId: string;
    reason: "NOT_FOUND" | "NOT_CONFIRMED" | "ALREADY_ANNOUNCED";
  }> = [];

  for (const id of scheduleIds) {
    const schedule = await getScheduleForNotify(id, orgId);
    if (!schedule) {
      skipped.push({ scheduleId: id, reason: "NOT_FOUND" });
      continue;
    }
    if (!schedule.confirmed) {
      skipped.push({ scheduleId: id, reason: "NOT_CONFIRMED" });
      continue;
    }
    try {
      const { announced } = await notifyScheduleStakeholders({
        scheduleId: id,
        orgId,
        event: "CREATED",
        audience: "STUDENTS_AND_PARENTS",
      });
      if (announced) {
        succeeded += 1;
      } else {
        const currentSchedule = await getScheduleForNotify(id, orgId);
        skipped.push({
          scheduleId: id,
          reason: currentSchedule ? "ALREADY_ANNOUNCED" : "NOT_FOUND",
        });
      }
    } catch {
      const currentSchedule = await getScheduleForNotify(id, orgId);
      skipped.push({
        scheduleId: id,
        reason: currentSchedule ? "ALREADY_ANNOUNCED" : "NOT_FOUND",
      });
    }
  }

  return { data: { succeeded, skipped } };
}

export async function toggleScheduleLockAction(input: ToggleScheduleLockInput) {
  try {
    const auth = await authAccess({
      requiredRole: "DIRECTION",
      requiredFunction: ["PRINCIPAL", "SECRETARY"],
      allowPersonalOrg: true,
    });
    if (!auth.data) return { error: auth.error };
    const { user, orgId } = auth.data;

    const parsed = v.safeParse(toggleScheduleLockSchema, input);
    if (!parsed.success)
      return { error: parsed.issues[0]?.message ?? "Données invalides" };

    const { scheduleId, data } = parsed.output;

    const result = await toggleScheduleLock({
      scheduleId,
      orgId,
      isLocked: data.isLocked,
    });

    logAuditAsync({
      userId: user.id,
      orgId,
      action: "UPDATE",
      resource: "SCHEDULE",
      resourceId: scheduleId,
      actor: { name: user.name, email: user.email },
      details: {
        event: data.isLocked ? "SCHEDULE_LOCKED" : "SCHEDULE_UNLOCKED",
      },
    });

    return { data: result };
  } catch (error) {
    console.error("toggleScheduleLockAction:", error);
    return { error: error instanceof Error ? error.message : ERRORS.SERVER };
  }
}

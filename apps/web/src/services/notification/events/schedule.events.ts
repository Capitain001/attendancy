import { NotificationEvent, Resource, type ScheduleStatus } from "@/generated/prisma/browser";

import {
  claimScheduleAnnouncement,
  getScheduleForNotify,
} from "@/services/schedule/server";
import {
  getStudentsScheduleMessage,
} from "../messages";
import { formatDate } from "@/lib/date";
import {
  resolveScheduleParents,
  resolveScheduleStudentAttendees,
  resolveScheduleTeacherRecipients,
} from "../audiences";
import { sendPushNotificationToUserById } from "../push";

export type ScheduleNotifyBefore = {
  teacherId?: string;
  confirmed?: boolean;
  status?: ScheduleStatus;
  teacherUserId?: string | null;
};

type ScheduleEvent = Extract<NotificationEvent, "CREATED" | "CONFIRMED" | "UPDATED" | "CANCELED">;

export type ScheduleNotifyParams =
  | {
      scheduleId: string;
      orgId: string;
      event: "CREATED";
      audience?: "ALL" | "STUDENTS_AND_PARENTS";
    }
  | {
      scheduleId: string;
      orgId: string;
      event: Exclude<ScheduleEvent, "CREATED">;
      before: ScheduleNotifyBefore;
    };

export function isConfirmedSchedule(
  event: ScheduleNotifyParams["event"],
  schedule: { confirmed: boolean },
  before?: ScheduleNotifyBefore,
): boolean {
  return event === "CREATED"
    ? schedule.confirmed
    : event === "CONFIRMED" || before?.confirmed === true;
}

export async function onScheduleEvent(
  params: ScheduleNotifyParams,
): Promise<{ announced: boolean }> {
  let announced = false;
  try {
    const { scheduleId, orgId, event } = params;
    const before = event === "CREATED" ? undefined : params.before;
    if (event === "CANCELED" && before?.status === "CANCELED") {
      return { announced };
    }

    const schedule = await getScheduleForNotify(scheduleId, orgId);
    if (!schedule) throw new Error(`Séance introuvable : ${scheduleId}`);

    const day = formatDate(schedule.startTime, "DAY_MONTH");
    const recipientIds = new Set<string>();
    const notifications: Array<{
      userId: string;
      message: string;
      event: NotificationEvent;
    }> = [];

    const addRecipient = (
      userId: string | null | undefined,
      message: string,
      event: NotificationEvent,
    ) => {
      if (!userId || recipientIds.has(userId)) return;
      recipientIds.add(userId);
      notifications.push({ userId, message, event });
    };

    // 1. Enseignants
    const teacherRecipients = resolveScheduleTeacherRecipients({
      event,
      courseName: schedule.course.name,
      day,
      audience: event === "CREATED" ? params.audience : undefined,
      newTeacherId: schedule.teacherId,
      newTeacherUserId: schedule.teacher?.userId,
      beforeTeacherId: before?.teacherId,
      beforeTeacherUserId: before?.teacherUserId,
    });

    for (const r of teacherRecipients) {
      addRecipient(r.userId, r.message, r.event);
    }

    // 2. Vérification confirmation & claim atomique
    const isConfirmed = isConfirmedSchedule(event, schedule, before);
    const claimRequired = event === "CREATED" || event === "CONFIRMED";
    if (isConfirmed && claimRequired) {
      try {
        announced = await claimScheduleAnnouncement(scheduleId, orgId);
      } catch (error) {
        console.error("[onScheduleEvent] Claim échoué:", error);
      }
    }

    // 3. Élèves et parents
    if (isConfirmed && (!claimRequired || announced)) {
      const studentsMessage = getStudentsScheduleMessage(
        event,
        schedule.course.name,
        day,
      );

      const { studentIds, userIds } =
        await resolveScheduleStudentAttendees(scheduleId);
      for (const userId of userIds) {
        addRecipient(userId, studentsMessage, event);
      }

      const parentUserIds = await resolveScheduleParents(studentIds, orgId);
      for (const userId of parentUserIds) {
        addRecipient(userId, studentsMessage, event);
      }
    }

    // 4. Émission best-effort
    const results = await Promise.allSettled(
      notifications.map(({ userId, message, event: notifEvent }) =>
        sendPushNotificationToUserById(userId, {
          orgId,
          message,
          resourceType: Resource.SCHEDULE,
          resourceId: scheduleId,
          event: notifEvent,
        }),
      ),
    );

    for (const result of results) {
      if (result.status === "rejected") {
        console.error("[onScheduleEvent] Émission échouée:", result.reason);
      }
    }
  } catch (error) {
    console.error("[onScheduleEvent] Erreur inattendue:", error);
  }

  return { announced };
}

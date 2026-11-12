import { format } from "date-fns";
import { fr } from "date-fns/locale";
import type { ScheduleStatus } from "@/generated/prisma/client";
import { NotificationType } from "@/generated/prisma/client";
import { getExpectedAttendees } from "@/services/attendance/server";
import { getNotifiableParentUserIdsForStudents } from "@/services/parent/server";
import { sendPushNotificationById } from "@/modules/notification/action";
import { claimScheduleAnnouncement, getScheduleForNotify } from "./database";

export type ScheduleNotifyBefore = {
  teacherId?: string;
  confirmed?: boolean;
  status?: ScheduleStatus;
  teacherUserId?: string | null;
};

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
      event: "CONFIRMED" | "UPDATED" | "CANCELED";
      before: ScheduleNotifyBefore;
    };

export async function notifyScheduleStakeholders(
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

    const day = format(schedule.startTime, "EEEE d MMMM", { locale: fr });
    const oldTeacherUserId = before?.teacherUserId;
    const newTeacherUserId = schedule.teacher?.userId;
    const teacherReassigned =
      (event === "UPDATED" || event === "CONFIRMED") &&
      before?.teacherId !== undefined &&
      before.teacherId !== schedule.teacherId;
    const recipientIds = new Set<string>();
    const notifications: Array<{
      userId: string;
      message: string;
      type: NotificationType;
    }> = [];
    const addRecipient = (
      userId: string | null | undefined,
      message: string,
      type: NotificationType,
    ) => {
      if (!userId || recipientIds.has(userId)) return;
      recipientIds.add(userId);
      notifications.push({ userId, message, type });
    };

    const notifyTeacherForEvent =
      event === "CREATED"
        ? params.audience !== "STUDENTS_AND_PARENTS"
        : event === "UPDATED" || event === "CANCELED";

    if (teacherReassigned) {
      addRecipient(
        oldTeacherUserId,
        `Le cours ${schedule.course.name} du ${day} ne vous est plus assigné.`,
        NotificationType.SCHEDULE_UPDATE,
      );
      addRecipient(
        newTeacherUserId,
        `Vous êtes affecté au cours ${schedule.course.name} le ${day}.`,
        NotificationType.NEW_COURSE,
      );
    } else if (notifyTeacherForEvent) {
      const teacherMessage =
        event === "CREATED"
          ? `Vous êtes affecté au cours ${schedule.course.name} le ${day}.`
          : event === "CANCELED"
            ? `Le cours ${schedule.course.name} du ${day} est annulé.`
            : `Le cours ${schedule.course.name} du ${day} a été modifié.`;
      addRecipient(
        newTeacherUserId,
        teacherMessage,
        event === "CREATED" || event === "CONFIRMED"
          ? NotificationType.NEW_COURSE
          : NotificationType.SCHEDULE_UPDATE,
      );
    }

    const shouldAnnounceStudentsAndParents =
      event === "CREATED"
        ? schedule.confirmed
        : event === "CONFIRMED" || before?.confirmed === true;
    const claimRequired = event === "CREATED" || event === "CONFIRMED";
    if (shouldAnnounceStudentsAndParents && claimRequired) {
      try {
        announced = await claimScheduleAnnouncement(scheduleId, orgId);
      } catch (error) {
        console.error("[notifyScheduleStakeholders] Claim échoué:", error);
      }
    }
    if (shouldAnnounceStudentsAndParents && (!claimRequired || announced)) {
      const studentsMessage =
        event === "CANCELED"
          ? `Le cours ${schedule.course.name} du ${day} est annulé.`
          : event === "UPDATED"
            ? `Le cours ${schedule.course.name} du ${day} a été modifié (salle, horaire ou enseignant).`
            : `Nouveau cours : ${schedule.course.name} le ${day}.`;
      const notificationType =
        event === "UPDATED" || event === "CANCELED"
          ? NotificationType.SCHEDULE_UPDATE
          : NotificationType.NEW_COURSE;

      let studentIds: string[] = [];
      try {
        const attendees = await getExpectedAttendees(scheduleId);
        studentIds = attendees.map((attendee) => attendee.studentId);
        for (const attendee of attendees) {
          addRecipient(attendee.userId, studentsMessage, notificationType);
        }
      } catch (error) {
        console.error(
          "[notifyScheduleStakeholders] Résolution des élèves échouée:",
          error,
        );
      }

      try {
        const parentUserIds = await getNotifiableParentUserIdsForStudents(
          studentIds,
          orgId,
        );
        for (const userId of parentUserIds) {
          addRecipient(userId, studentsMessage, notificationType);
        }
      } catch (error) {
        console.error(
          "[notifyScheduleStakeholders] Résolution des parents échouée:",
          error,
        );
      }
    }

    const metadata = { kind: "schedule", scheduleId, event };
    const results = await Promise.allSettled(
      notifications.map(({ userId, message, type }) =>
        sendPushNotificationById(userId, {
          message,
          type,
          scheduleId,
          metadata,
        }),
      ),
    );
    for (const result of results) {
      if (result.status === "rejected") {
        console.error(
          "[notifyScheduleStakeholders] Émission échouée:",
          result.reason,
        );
      }
    }
    return { announced };
  } catch (error) {
    console.error("[notifyScheduleStakeholders]", error);
    return { announced };
  }
}

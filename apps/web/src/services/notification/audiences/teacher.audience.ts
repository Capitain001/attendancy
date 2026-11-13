//apps\web\src\services\notification\audiences\teacher.audience.ts
import { NotificationEvent, Resource } from "@/generated/prisma/browser";
import {
  getTeacherScheduleMessage,
  getTeacherUnassignedMessage,
} from "../messages";

export type TeacherRecipient = {
  userId: string;
  message: string;
  resourceType: Resource;
  event: NotificationEvent;
};

export function resolveScheduleTeacherRecipients(params: {
  event: NotificationEvent;
  courseName: string;
  day: string;
  audience?: "ALL" | "STUDENTS_AND_PARENTS";
  newTeacherId?: string;
  newTeacherUserId?: string | null;
  beforeTeacherId?: string;
  beforeTeacherUserId?: string | null;
}): TeacherRecipient[] {
  const {
    event,
    courseName,
    day,
    audience,
    newTeacherId,
    newTeacherUserId,
    beforeTeacherId,
    beforeTeacherUserId,
  } = params;

  const recipients: TeacherRecipient[] = [];

  const teacherReassigned =
    (event === "UPDATED" || event === "CONFIRMED") &&
    beforeTeacherId !== undefined &&
    beforeTeacherId !== newTeacherId;

  if (teacherReassigned) {
    if (beforeTeacherUserId) {
      recipients.push({
        userId: beforeTeacherUserId,
        message: getTeacherUnassignedMessage(courseName, day),
        resourceType: Resource.SCHEDULE,
        event: NotificationEvent.UNASSIGNED,
      });
    }
    if (newTeacherUserId) {
      recipients.push({
        userId: newTeacherUserId,
        message: getTeacherScheduleMessage(NotificationEvent.CREATED, courseName, day),
        resourceType: Resource.SCHEDULE,
        event: NotificationEvent.CREATED,
      });
    }
    return recipients;
  }

  const notifyTeacherForEvent =
    event === "CREATED"
      ? audience !== "STUDENTS_AND_PARENTS"
      : event === "UPDATED" || event === "CANCELED";

  if (notifyTeacherForEvent && newTeacherUserId) {
    recipients.push({
      userId: newTeacherUserId,
      message: getTeacherScheduleMessage(event, courseName, day),
      resourceType: Resource.SCHEDULE,
      event,
    });
  }

  return recipients;
}

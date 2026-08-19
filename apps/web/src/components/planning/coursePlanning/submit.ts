import { isBefore } from "date-fns";
import type { ScheduleStatus } from "@/generated/prisma/browser";

import type { ScheduleEvent } from "@/components/event-calendar";

import { statusToColor } from "../utils";
import type {
  CoursePlanningFormState,
  PlanningCourseRow,
  PlanningRoomRow,
} from "../types";
import { NO_GROUP } from "./constants";
import type { computeSlotFromFormTimes } from "./timeRange";

export type ScheduleBuildResult =
  | { ok: true; event: ScheduleEvent }
  | { ok: false; message: string };

export function validateScheduleForSave(
  form: CoursePlanningFormState,
  slot: ReturnType<typeof computeSlotFromFormTimes>
): { ok: true; slot: NonNullable<typeof slot> } | { ok: false; message: string } {
  if (!form.courseId) return { ok: false, message: "Choisissez un cours." };
  if (!form.roomId) return { ok: false, message: "Choisissez une salle." };
  if (!slot) return { ok: false, message: "Plage horaire invalide." };
  if (isBefore(slot.end, slot.start)) {
    return { ok: false, message: "L'heure de fin ne peut pas précéder le début." };
  }
  return { ok: true, slot };
}

export function buildScheduleEventFromForm(input: {
  form: CoursePlanningFormState;
  slot: NonNullable<ReturnType<typeof computeSlotFromFormTimes>>;
  eventId?: string;
  classId: string;
  courseMap: Map<string, PlanningCourseRow>;
  roomMap: Map<string, PlanningRoomRow>;
  statusOverride?: ScheduleStatus;
}): ScheduleBuildResult {
  const {
    form,
    slot,
    eventId,
    classId,
    courseMap,
    roomMap,
    statusOverride,
  } = input;

  const validation = validateScheduleForSave(form, slot);
  if (!validation.ok) return { ok: false, message: validation.message };

  const course = courseMap.get(form.courseId);
  const room = roomMap.get(form.roomId);
  const resolvedStatus = statusOverride ?? form.status;

  const event: ScheduleEvent = {
    id: eventId ?? "",
    title: course?.name ?? "Séance",
    description: form.notes,
    start: slot.start,
    end: slot.end,
    location: room?.name ?? "",
    color: statusToColor(resolvedStatus) as ScheduleEvent["color"],
    meta: {
      classId,
      courseId: form.courseId,
      teacherId: form.teacherId,
      roomId: form.roomId,
      groupId: form.groupId === NO_GROUP ? undefined : form.groupId,
      status: resolvedStatus,
      confirmed: form.confirmed,
    },
  };

  return { ok: true, event };
}

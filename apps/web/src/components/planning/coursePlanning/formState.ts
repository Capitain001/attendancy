import type { ScheduleEvent } from "@/components/event-calendar";
import {
  DefaultEndHour,
  DefaultStartHour,
} from "@/components/event-calendar/constants";

import type { CoursePlanningFormState } from "../types";
import { NO_GROUP, NO_TEACHER } from "./constants";
import { formatTimeForInput } from "./timeRange";

export function getInitialCoursePlanningFormState(
  event: ScheduleEvent | null | undefined
): CoursePlanningFormState {
  if (!event) {
    return {
      courseId: "",
      roomId: "",
      teacherId: NO_TEACHER,
      groupId: NO_GROUP,
      startDate: new Date(),
      startTime: `${DefaultStartHour}:00`,
      endTime: `${DefaultEndHour}:00`,
      notes: "",
      status: "PENDING",
      confirmed: false,
    };
  }

  const start = new Date(event.start);
  const end = new Date(event.end);

  return {
    courseId: event.meta.courseId ?? "",
    roomId: event.meta.roomId ?? "",
    teacherId: event.meta.teacherId ?? NO_TEACHER,
    groupId: event.meta.groupId ?? NO_GROUP,
    startDate: start,
    startTime: formatTimeForInput(start),
    endTime: formatTimeForInput(end),
    notes: event.description ?? "",
    status: event.meta.status ?? "PENDING",
    confirmed: event.meta.confirmed ?? false,
  };
}

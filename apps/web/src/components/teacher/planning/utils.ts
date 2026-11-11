// src/components/teacher/planning/utils.ts
import { differenceInMinutes } from "date-fns";
import type { ScheduleEvent } from "@/components/event-calendar";
import { getInitialCoursePlanningFormState, NO_TEACHER } from "@/components/planning/coursePlanning";
import type { CoursePlanningFormState } from "@/components/planning/types";
import type { PlanningResources } from "@/services/planning";

export function formatDurationMinutes(minutes: number): string {
  if (minutes <= 0) return "";
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins} min`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h${mins.toString().padStart(2, "0")}`;
}

export function computeSlotDurationMinutes(slot: { start: Date; end: Date } | null): number {
  return slot ? differenceInMinutes(slot.end, slot.start) : 0;
}

export function resolveTeacherDialogDefaultForm(params: {
  event: ScheduleEvent | null;
  resources: NonNullable<PlanningResources>;
  teacherId?: string;
}): CoursePlanningFormState {
  const { event, resources, teacherId } = params;
  const base = getInitialCoursePlanningFormState(event);
  const resolvedCourseId =
    base.courseId || (resources.courses.length === 1 ? resources.courses[0].id : "");
  const resolvedRoomId =
    base.roomId || (resources.rooms.length >= 1 ? resources.rooms[0].id : "");
  const selectedCourse = resolvedCourseId
    ? resources.courses.find((c) => c.id === resolvedCourseId)
    : undefined;
  const courseTeachers = selectedCourse?.teachers ?? [];
  const fallbackTeacherId =
    teacherId ??
    courseTeachers[0]?.id ??
    resources.courses[0]?.teachers[0]?.id ??
    NO_TEACHER;
  const resolvedTeacherId =
    base.teacherId && base.teacherId !== NO_TEACHER ? base.teacherId : fallbackTeacherId;

  return {
    ...base,
    courseId: resolvedCourseId,
    roomId: resolvedRoomId,
    teacherId: resolvedTeacherId,
  };
}


import type { ScheduleStatus } from "@/generated/prisma";

import type { PlanningResources } from "@/services/planning";

export { NO_GROUP, NO_TEACHER } from "./coursePlanning/constants";

export type PlanningCourseRow = NonNullable<PlanningResources>["courses"][number];
export type PlanningTeacherRow = PlanningCourseRow["teachers"][number];
export type PlanningRoomRow = NonNullable<PlanningResources>["rooms"][number];

type Course = PlanningCourseRow;
type Teacher = Course["teachers"][number];
type Room = PlanningRoomRow;

type CourseSlot = Pick<Course, "id" | "name"> & {
  startTime: string;
  endTime: string;
};

export interface CoursePlanningFormState {
  courseId: string;
  roomId: string;
  teacherId: string;
  groupId: string;
  startDate: Date;
  startTime: string;
  endTime: string;
  notes: string;
  status: ScheduleStatus;
  confirmed: boolean;
}

export type CoursePlanningCardUpdatePatch = Partial<{
  date: Date;
  courseId: string;
  startTime: string;
  endTime: string;
  roomId: string;
  teacherId: string;
}>;

export interface CoursePlanningCardProps {
  date: string;
  course: CourseSlot;
  teachers: Teacher[];
  room: Room;
  status: ScheduleStatus;
  groupId?: string;
  notes?: string | null;
  confirmed?: boolean;
  scheduleId?: string;
}

export type TimeOption = {
  value: string;
  label: string;
};

export type TimeValue = TimeOption["value"];

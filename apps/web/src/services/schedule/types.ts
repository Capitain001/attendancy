
//src/services/schedule/types.ts
export * from './generated.types'
import type { getTeacherNextSchedule } from '@/services/session/database'
import type { getSchedules } from './database'
import type { Schedule, ScheduleStatus } from "@/generated/prisma/client";

export type TeacherNextSchedule = Awaited<ReturnType<typeof getTeacherNextSchedule>>
export type GetSchedulesReturn = Awaited<ReturnType<typeof getSchedules>>


// Source de vérité : le modèle Prisma. Tout drift de schema.prisma casse
export type CreateScheduleData = Pick<
  Schedule,
  | "courseId"
  | "teacherId"
  | "roomId"
  | "classId"
  | "groupId"
  | "startTime"
  | "endTime"
  | "notes"
  | "confirmed"
>;

export type UpdateScheduleData = Partial<CreateScheduleData & {status:ScheduleStatus}>


/* type UpdateScheduleData = {
 courseId?: string | undefined;
 roomId?: string | undefined;
 teacherId?: string | undefined;
 startTime?: Date | undefined;
 endTime?: Date | undefined;
 confirmed?: boolean | undefined;
 notes?: string | null | undefined;
 classId?: string | undefined;
 groupId?: string | null | undefined;
 status?: ScheduleStatus | undefined;
} */
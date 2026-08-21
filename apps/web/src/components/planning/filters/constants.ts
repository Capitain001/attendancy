import { ScheduleStatus } from '@/generated/prisma/browser'

export const SCHEDULE_STATUS_VALUES = [
  ScheduleStatus.PENDING,
  ScheduleStatus.COMPLETED,
  ScheduleStatus.CANCELED,
  ScheduleStatus.MISSED,
] as const satisfies ScheduleStatus[]

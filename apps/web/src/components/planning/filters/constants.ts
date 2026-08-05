import { ScheduleStatus } from '@/generated/prisma/client'

export const SCHEDULE_STATUS_VALUES = [
  ScheduleStatus.PENDING,
  ScheduleStatus.COMPLETED,
  ScheduleStatus.CANCELED,
  ScheduleStatus.MISSED,
] as const satisfies ScheduleStatus[]

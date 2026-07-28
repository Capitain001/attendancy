import type { ScheduleStatus } from '@/generated/prisma'

export type DBSchedule = { status: ScheduleStatus; startTime: Date; endTime: Date }

export type ScheduleUiStatus =
  | 'PENDING'
  | 'ONGOING'
  | 'COMPLETED'
  | 'CANCELED'
  | 'MISSED'

export const SCHEDULE_UI_STATUS_LABEL: Record<ScheduleUiStatus, string> = {
  PENDING:   'À venir',
  ONGOING:   'En cours',
  COMPLETED: 'Terminée',
  CANCELED: 'Annulée',
  MISSED:    'Manquée',
}

export function resolveScheduleUiStatus(schedule: DBSchedule, now: Date): ScheduleUiStatus {
  if (schedule.status !== 'PENDING') return schedule.status as ScheduleUiStatus
  if (now < schedule.startTime) return 'PENDING'
  if (now < schedule.endTime)   return 'ONGOING'
  return 'MISSED'
}

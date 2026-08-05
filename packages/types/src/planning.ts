import type { ScheduleSlot } from './schedule'

export type PlanningSlotDto = ScheduleSlot & {
  hasActiveSession: boolean
  sessionId: string | null
}

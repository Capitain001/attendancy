import type { ScheduleStatus } from '@/generated/prisma/browser'
import type { GetTeacherSchedulesInfoDto } from '@/services/schedule'

export type ScheduleItem = GetTeacherSchedulesInfoDto[number]

export const STATUS_CONFIG: Record<ScheduleStatus, { label: string; dot: string }> = {
  PENDING: { label: 'À venir', dot: 'bg-amber-500' },
  COMPLETED: { label: 'Terminé', dot: 'bg-emerald-500' },
  CANCELED: { label: 'Annulé', dot: 'bg-rose-500' },
  MISSED: { label: 'Manqué', dot: 'bg-teacher-muted' },
}

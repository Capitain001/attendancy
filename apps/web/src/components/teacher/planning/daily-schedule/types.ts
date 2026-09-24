import type { ScheduleStatus } from '@/generated/prisma/browser'
import type { GetTeacherSchedulesInfoDto } from '@/services/schedule'
import { SCHEDULE_UI_STATUS_LABEL, ScheduleUiStatus } from '@/services/schedule/policy';

export type ScheduleItem = GetTeacherSchedulesInfoDto[number]

/**
 * Clé = ScheduleUiStatus (et non plus ScheduleStatus DB) : ajoute ONGOING.
 * Libellés : source unique = SCHEDULE_UI_STATUS_LABEL.
 * Les classes `dot` sont à adapter à tes couleurs existantes.
 */
export const STATUS_CONFIG: Record<ScheduleUiStatus, { label: string; dot: string }> = {
  PENDING: {
    label: SCHEDULE_UI_STATUS_LABEL.PENDING,
    dot: 'bg-teacher-muted',
  },
  ONGOING: {
    label: SCHEDULE_UI_STATUS_LABEL.ONGOING,
    dot: 'bg-green-500 animate-pulse',
  },
  COMPLETED: {
    label: SCHEDULE_UI_STATUS_LABEL.COMPLETED,
    dot: 'bg-emerald-500',
  },
  CANCELED: {
    label: SCHEDULE_UI_STATUS_LABEL.CANCELED,
    dot: 'bg-red-500',
  },
  MISSED: {
    label: SCHEDULE_UI_STATUS_LABEL.MISSED,
    dot: 'bg-amber-500',
  },
}

/** Schedule enrichi du statut d'affichage dérivé (DB + temps). */
export type ScheduleWithUi = ScheduleItem & { uiStatus: ScheduleUiStatus }
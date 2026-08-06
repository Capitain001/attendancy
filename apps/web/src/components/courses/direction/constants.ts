import type { ScheduleStatus, EvaluationType } from './types'

export const SCHEDULE_STATUS_LABELS: Record<ScheduleStatus, string> = {
  PENDING: 'À venir',
  COMPLETED: 'Complétée',
  CANCELED: 'Annulée',
  MISSED: 'Manquée',
}

export const SCHEDULE_STATUS_CLASSES: Record<ScheduleStatus, string> = {
  PENDING: 'bg-amber-50 text-amber-800',
  COMPLETED: 'bg-green-50 text-green-800',
  CANCELED: 'bg-red-50 text-red-800',
  MISSED: 'bg-gray-100 text-gray-600',
}

export const EVAL_TYPE_LABELS: Record<EvaluationType, string> = {
  DEVOIR: 'Devoir',
  EXAMEN: 'Examen',
  PARTICIPATION: 'Participation',
  PROJET: 'Projet',
}

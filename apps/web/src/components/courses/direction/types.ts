import type { GetCourseDetailDto } from '@/services/course'

/** Détail cours non-null — base d'inférence des types UI. */
type CourseDetail = NonNullable<GetCourseDetailDto>

export type ScheduleItem     = CourseDetail['schedules'][number]
export type ScheduleStatus   = ScheduleItem['status']
export type AttendanceStatus = ScheduleItem['attendances'][number]['status']

// Propre à l'UI (pas encore de source service — évaluations à venir).
export type EvaluationType = 'DEVOIR' | 'EXAMEN' | 'PARTICIPATION' | 'PROJET'

export interface EvaluationSummary {
  type: EvaluationType
  count: number
  avgScore: number
  maxScore: number
}

/** Champs éditables de la fiche « Informations du cours ». */
export interface CourseInfoFields {
  name: string
  description: string | null
  credits: number
  ueCourse: { code: string | null; duration: number }
  class: { name: string; level: string }
}

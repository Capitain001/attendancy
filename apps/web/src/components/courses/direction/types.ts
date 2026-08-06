import type { GetCourseDetailDto } from '@/services/course'
import type { GetTeachersDto } from '@/services/teacher'
import type { GetCourseTeachersDto } from '@/services/course-teacher'
import type { EvaluationType } from '@/generated/prisma/client'

// ─────────────────────────────────────────────────────────────────────────────
// Types SOURCES — inférés des services. Toute vue UI de ce dossier dérive d'ici,
// jamais d'un objet réécrit à la main (aligné automatiquement si le service évolue).
// ─────────────────────────────────────────────────────────────────────────────

/** Détail cours non-null — source des vues cours. */
export type CourseDetail = NonNullable<GetCourseDetailDto>
/** Ligne enseignant de l'org — source du sélecteur d'affectation. */
type TeacherRow = GetTeachersDto[number]
/** Ligne d'affectation enseignant ↔ cours. */
type CourseTeacherRow = GetCourseTeachersDto[number]

// ─────────────────────────────────────────────────────────────────────────────
// Types UI DÉRIVÉS
// ─────────────────────────────────────────────────────────────────────────────

export type ScheduleItem     = CourseDetail['schedules'][number]
export type ScheduleStatus   = ScheduleItem['status']
export type AttendanceStatus = ScheduleItem['attendances'][number]['status']

/** Enseignant projeté (aplati) pour l'UI — dérivé de getTeachers. */
export type Teacher = Pick<TeacherRow['user'], 'firstName' | 'lastName' | 'avatar_url'> & {
  id: TeacherRow['id']
}

/** Affectation projetée pour l'UI — dérivée de getCourseTeachers. */
export type CourseTeacherRelation = Pick<CourseTeacherRow, 'id' | 'isMain' | 'hours'> & {
  teacherId: NonNullable<CourseTeacherRow['teacher']>['id'] | null
}

/** Données du bandeau cours — dérivé de CourseDetail. */
export type CourseBannerData = Pick<CourseDetail, 'id' | 'name' | 'credits'> & {
  ueCourse: Pick<CourseDetail['ueCourse'], 'code'>
  class: Pick<CourseDetail['class'], 'name'>
}

/** Champs éditables « Informations du cours » — dérivé de CourseDetail. */
export type CourseInfoFields = Pick<CourseDetail, 'name' | 'description' | 'credits'> & {
  ueCourse: Pick<CourseDetail['ueCourse'], 'code' | 'duration'>
  class: Pick<CourseDetail['class'], 'name' | 'level'>
}

// Dérivé de l'enum Prisma — reste aligné si le schéma évolue.
export type { EvaluationType }

/** Agrégat d'évaluation — propre à l'UI tant que le service dédié n'existe pas. */
export interface EvaluationSummary {
  type: EvaluationType
  count: number
  avgScore: number
  maxScore: number
}

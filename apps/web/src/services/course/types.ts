import type { CreateCourseInput } from './validation'
import type { GetCoursesByClassDto } from './generated.types'

export * from './generated.types'
export type { CreateCourseInput }

/** Cours d'une classe avec ses enseignants — élément de getCoursesByClass. */
export type CourseDTO = GetCoursesByClassDto[number]

import type { CreateCourseInput, AssignTeacherInput } from './validation'
import type { getCourse, getCoursesByClass, getCourseTeachers } from './database'

export type { CreateCourseInput, AssignTeacherInput }

export type CourseItem        = GetCoursesDto[number]
export type CourseTeacherItem = CourseItem['teachers'][number]
export type CourseTeacher     = GetCourseTeachersDto[number]

// V1 aliases
export type CourseDTO      = CourseItem
export type AddCourseData  = CreateCourseInput
export type UpdateCourseData = AssignTeacherInput
export * from './generated.types'

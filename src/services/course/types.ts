import type { CreateCourseInput, AssignTeacherInput } from './validation'
import type { getCoursesByClass, getCourseTeachers } from './database'

export type { CreateCourseInput, AssignTeacherInput }

export type GetCoursesDto = Awaited<ReturnType<typeof getCoursesByClass>>
export type CourseItem    = GetCoursesDto[number]
export type CourseTeacherItem = CourseItem['teachers'][number]
export type GetCourseTeachersDto = Awaited<ReturnType<typeof getCourseTeachers>>
export type CourseTeacher = GetCourseTeachersDto[number]

// V1 aliases
export type CourseDTO = CourseItem
export type AddCourseData = CreateCourseInput
export type UpdateCourseData = AssignTeacherInput

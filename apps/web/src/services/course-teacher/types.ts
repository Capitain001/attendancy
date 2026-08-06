import type { AssignTeacherInput, SyncCourseTeachersInput } from './validation'
import type { GetCourseTeachersDto } from './generated.types'

export * from './generated.types'
export type { AssignTeacherInput, SyncCourseTeachersInput }

/** Affectation enseignant d'un cours — élément de getCourseTeachers. */
export type CourseTeacher = GetCourseTeachersDto[number]

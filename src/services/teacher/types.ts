import type { UpdateTeacherDepartmentInput } from './validation'
import type { getTeachers, getTeacher } from './database'

export type { UpdateTeacherDepartmentInput }

export type GetTeachersDto = Awaited<ReturnType<typeof getTeachers>>
export type TeacherItem    = GetTeachersDto[number]
export type GetTeacherDto  = Awaited<ReturnType<typeof getTeacher>>
export type TeacherDTo     = TeacherItem

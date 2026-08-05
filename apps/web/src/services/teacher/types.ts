import type { UpdateTeacherDepartmentInput } from './validation'
import type { getTeachers, getTeacher, getTeacherStats, getTeacherOrganizationStats } from './database'

export type { UpdateTeacherDepartmentInput }

export type TeacherItem                = GetTeachersDto[number]
export type TeacherDTo                 = TeacherItem
export type TeacherOrganizationStats   = Awaited<ReturnType<typeof getTeacherOrganizationStats>>
export * from './generated.types'

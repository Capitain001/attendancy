import type { UpdateTeacherDepartmentInput } from './validation'
import type { getTeachers, getTeacher, getTeacherStats, getTeacherOrganizationStats } from './database'

export type { UpdateTeacherDepartmentInput }

export type GetTeachersDto             = Awaited<ReturnType<typeof getTeachers>>
export type TeacherItem                = GetTeachersDto[number]
export type GetTeacherDto              = Awaited<ReturnType<typeof getTeacher>>
export type TeacherDTo                 = TeacherItem
export type GetTeacherStatsDto         = Awaited<ReturnType<typeof getTeacherStats>>
export type TeacherOrganizationStats   = Awaited<ReturnType<typeof getTeacherOrganizationStats>>

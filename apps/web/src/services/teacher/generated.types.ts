// ⚠ Fichier généré automatiquement — NE PAS ÉDITER À LA MAIN
// Régénérer : npx tsx scripts/generate/types/types.ts teacher
// Pour surcharger un type, définissez-le dans ./types.ts (jamais écrasé).

import { getTeacherStats, getOrganizationTeacherStats, updateTeacherDepartment, getTeachers, getTeacherTodaySchedules, getTeacherCourses, getTeacherSchedules, getTeacher } from './database'

export type GetTeacherStatsDto = Awaited<ReturnType<typeof getTeacherStats>>
export type GetOrganizationTeacherStatsDto = Awaited<ReturnType<typeof getOrganizationTeacherStats>>
export type UpdateTeacherDepartmentDto = Awaited<ReturnType<typeof updateTeacherDepartment>>
export type GetTeachersDto = Awaited<ReturnType<typeof getTeachers>>
export type GetTeacherTodaySchedulesDto = Awaited<ReturnType<typeof getTeacherTodaySchedules>>
export type GetTeacherCoursesDto = Awaited<ReturnType<typeof getTeacherCourses>>
export type GetTeacherSchedulesDto = Awaited<ReturnType<typeof getTeacherSchedules>>
export type GetTeacherDto = Awaited<ReturnType<typeof getTeacher>>

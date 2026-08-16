// ⚠ Fichier généré automatiquement — NE PAS ÉDITER À LA MAIN
// Régénérer : npx tsx scripts/generate/types/types.ts teacher
// Pour surcharger un type, définissez-le dans ./types.ts (jamais écrasé).

import { updateTeacherDepartment, getTeachers, getTeacherTodaySchedules, getTeacherCourses, getTeacherSchedules, getTeacherStats, getTeacherOrganizationStats, getTeacher } from './database'

export type UpdateTeacherDepartmentDto = Awaited<ReturnType<typeof updateTeacherDepartment>>
export type GetTeachersDto = Awaited<ReturnType<typeof getTeachers>>
export type GetTeacherTodaySchedulesDto = Awaited<ReturnType<typeof getTeacherTodaySchedules>>
export type GetTeacherCoursesDto = Awaited<ReturnType<typeof getTeacherCourses>>
export type GetTeacherSchedulesDto = Awaited<ReturnType<typeof getTeacherSchedules>>
export type GetTeacherStatsDto = Awaited<ReturnType<typeof getTeacherStats>>
export type GetTeacherOrganizationStatsDto = Awaited<ReturnType<typeof getTeacherOrganizationStats>>
export type GetTeacherDto = Awaited<ReturnType<typeof getTeacher>>

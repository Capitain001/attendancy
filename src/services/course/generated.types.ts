// ⚠ Fichier généré automatiquement — NE PAS ÉDITER À LA MAIN
// Régénérer : npx tsx scripts/generate/types/types.ts course
// Pour surcharger un type, définissez-le dans ./types.ts (jamais écrasé).

import { getCourses, getCourseTeachers, getCourseTeachersIds, getCourse, getCoursesByClass } from './database'

export type GetCoursesDto = Awaited<ReturnType<typeof getCourses>>
export type GetCourseTeachersDto = Awaited<ReturnType<typeof getCourseTeachers>>
export type GetCourseTeachersIdsDto = Awaited<ReturnType<typeof getCourseTeachersIds>>
export type GetCourseDto = Awaited<ReturnType<typeof getCourse>>
export type GetCoursesByClassDto = Awaited<ReturnType<typeof getCoursesByClass>>

// ⚠ Fichier généré automatiquement — NE PAS ÉDITER À LA MAIN
// Régénérer : npx tsx scripts/generate/types/types.ts course
// Pour surcharger un type, définissez-le dans ./types.ts (jamais écrasé).

import { getCourses, getCourseClassId, getCourse, getCourseDetail, getCoursesByClass } from './database'

export type GetCoursesDto = Awaited<ReturnType<typeof getCourses>>
export type GetCourseClassIdDto = Awaited<ReturnType<typeof getCourseClassId>>
export type GetCourseDto = Awaited<ReturnType<typeof getCourse>>
export type GetCourseDetailDto = Awaited<ReturnType<typeof getCourseDetail>>
export type GetCoursesByClassDto = Awaited<ReturnType<typeof getCoursesByClass>>

// ⚠ Fichier généré automatiquement — NE PAS ÉDITER À LA MAIN
// Régénérer : npx tsx scripts/generate/types/types.ts course-teacher
// Pour surcharger un type, définissez-le dans ./types.ts (jamais écrasé).

import { getCourseTeachers, getCourseTeachersIds } from './database'

export type GetCourseTeachersDto = Awaited<ReturnType<typeof getCourseTeachers>>
export type GetCourseTeachersIdsDto = Awaited<ReturnType<typeof getCourseTeachersIds>>

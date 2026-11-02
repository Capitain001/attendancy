// ⚠ Fichier généré automatiquement — NE PAS ÉDITER À LA MAIN
// Régénérer : npx tsx scripts/generate/types/types.ts teacher-course-hours
// Pour surcharger un type, définissez-le dans ./types.ts (jamais écrasé).

import { getTeacherCourseHourss } from './database'

export type GetTeacherCourseHourssDto = Awaited<ReturnType<typeof getTeacherCourseHourss>>

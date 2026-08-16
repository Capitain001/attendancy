// ⚠ Fichier généré automatiquement — NE PAS ÉDITER À LA MAIN
// Régénérer : npx tsx scripts/generate/types/types.ts ue-course
// Pour surcharger un type, définissez-le dans ./types.ts (jamais écrasé).

import { createUECourse, updateUECourse, removeUECourse, getUECoursesByUE } from './database'

export type CreateUECourseDto = Awaited<ReturnType<typeof createUECourse>>
export type UpdateUECourseDto = Awaited<ReturnType<typeof updateUECourse>>
export type RemoveUECourseDto = Awaited<ReturnType<typeof removeUECourse>>
export type GetUECoursesByUEDto = Awaited<ReturnType<typeof getUECoursesByUE>>

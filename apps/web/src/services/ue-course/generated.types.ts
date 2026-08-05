// ⚠ Fichier généré automatiquement — NE PAS ÉDITER À LA MAIN
// Régénérer : npx tsx scripts/generate/types/types.ts ue-course
// Pour surcharger un type, définissez-le dans ./types.ts (jamais écrasé).

import { getUECoursesByUE } from './database'

export type GetUECoursesByUEDto = Awaited<ReturnType<typeof getUECoursesByUE>>

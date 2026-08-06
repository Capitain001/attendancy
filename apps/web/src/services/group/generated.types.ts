// ⚠ Fichier généré automatiquement — NE PAS ÉDITER À LA MAIN
// Régénérer : npx tsx scripts/generate/types/types.ts group
// Pour surcharger un type, définissez-le dans ./types.ts (jamais écrasé).

import { getGroupsByClass, getGroupEligibleStudents } from './database'

export type GetGroupsByClassDto = Awaited<ReturnType<typeof getGroupsByClass>>
export type GetGroupEligibleStudentsDto = Awaited<ReturnType<typeof getGroupEligibleStudents>>

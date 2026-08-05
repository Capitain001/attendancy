// ⚠ Fichier généré automatiquement — NE PAS ÉDITER À LA MAIN
// Régénérer : npx tsx scripts/generate/types/types.ts academic-year
// Pour surcharger un type, définissez-le dans ./types.ts (jamais écrasé).

import { getAcademicYears, getCurrentYear } from './database'

export type GetAcademicYearsDto = Awaited<ReturnType<typeof getAcademicYears>>
export type GetCurrentYearDto = Awaited<ReturnType<typeof getCurrentYear>>

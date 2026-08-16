// ⚠ Fichier généré automatiquement — NE PAS ÉDITER À LA MAIN
// Régénérer : npx tsx scripts/generate/types/types.ts academic-year
// Pour surcharger un type, définissez-le dans ./types.ts (jamais écrasé).

import { createAcademicYear, setCurrentYear, updateAcademicYear, removeAcademicYear, getAcademicYears, getCurrentYear } from './database'

export type CreateAcademicYearDto = Awaited<ReturnType<typeof createAcademicYear>>
export type SetCurrentYearDto = Awaited<ReturnType<typeof setCurrentYear>>
export type UpdateAcademicYearDto = Awaited<ReturnType<typeof updateAcademicYear>>
export type RemoveAcademicYearDto = Awaited<ReturnType<typeof removeAcademicYear>>
export type GetAcademicYearsDto = Awaited<ReturnType<typeof getAcademicYears>>
export type GetCurrentYearDto = Awaited<ReturnType<typeof getCurrentYear>>

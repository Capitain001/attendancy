// ⚠ Fichier généré automatiquement — NE PAS ÉDITER À LA MAIN
// Régénérer : npx tsx scripts/generate/types/types.ts term
// Pour surcharger un type, définissez-le dans ./types.ts (jamais écrasé).

import { createTerm, updateTerm, deleteTerm, generateTermsFromProgram, getTerms, getTerm } from './database'

export type CreateTermDto = Awaited<ReturnType<typeof createTerm>>
export type UpdateTermDto = Awaited<ReturnType<typeof updateTerm>>
export type DeleteTermDto = Awaited<ReturnType<typeof deleteTerm>>
export type GenerateTermsFromProgramDto = Awaited<ReturnType<typeof generateTermsFromProgram>>
export type GetTermsDto = Awaited<ReturnType<typeof getTerms>>
export type GetTermDto = Awaited<ReturnType<typeof getTerm>>

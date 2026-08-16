// ⚠ Fichier généré automatiquement — NE PAS ÉDITER À LA MAIN
// Régénérer : npx tsx scripts/generate/types/types.ts term
// Pour surcharger un type, définissez-le dans ./types.ts (jamais écrasé).

import { generateTermsFromProgram } from './database'

export type GenerateTermsFromProgramDto = Awaited<ReturnType<typeof generateTermsFromProgram>>

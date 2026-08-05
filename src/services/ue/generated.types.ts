// ⚠ Fichier généré automatiquement — NE PAS ÉDITER À LA MAIN
// Régénérer : npx tsx scripts/generate/types/types.ts ue
// Pour surcharger un type, définissez-le dans ./types.ts (jamais écrasé).

import { getUEs, getProgramUEs } from './database'

export type GetUEsDto = Awaited<ReturnType<typeof getUEs>>
export type GetProgramUEsDto = Awaited<ReturnType<typeof getProgramUEs>>

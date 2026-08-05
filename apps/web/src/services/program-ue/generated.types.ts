// ⚠ Fichier généré automatiquement — NE PAS ÉDITER À LA MAIN
// Régénérer : npx tsx scripts/generate/types/types.ts program-ue
// Pour surcharger un type, définissez-le dans ./types.ts (jamais écrasé).

import { getProgramUEs } from './database'

export type GetProgramUEsDto = Awaited<ReturnType<typeof getProgramUEs>>

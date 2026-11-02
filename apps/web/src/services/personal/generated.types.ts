// ⚠ Fichier généré automatiquement — NE PAS ÉDITER À LA MAIN
// Régénérer : npx tsx scripts/generate/types/types.ts personal
// Pour surcharger un type, définissez-le dans ./types.ts (jamais écrasé).

import { createPersonalClassTx, invalidatePersonalClassEvents, createPersonalClass, updatePersonalClass } from './database'

export type CreatePersonalClassTxDto = Awaited<ReturnType<typeof createPersonalClassTx>>
export type InvalidatePersonalClassEventsDto = Awaited<ReturnType<typeof invalidatePersonalClassEvents>>
export type CreatePersonalClassDto = Awaited<ReturnType<typeof createPersonalClass>>
export type UpdatePersonalClassDto = Awaited<ReturnType<typeof updatePersonalClass>>

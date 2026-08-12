// ⚠ Fichier généré automatiquement — NE PAS ÉDITER À LA MAIN
// Régénérer : npx tsx scripts/generate/types/types.ts ue
// Pour surcharger un type, définissez-le dans ./types.ts (jamais écrasé).

import { createUE, updateUE, reorderProgram, removeUE, getUEs, getProgramUEs, getUEByCode } from './database'

export type CreateUEDto = Awaited<ReturnType<typeof createUE>>
export type UpdateUEDto = Awaited<ReturnType<typeof updateUE>>
export type ReorderProgramDto = Awaited<ReturnType<typeof reorderProgram>>
export type RemoveUEDto = Awaited<ReturnType<typeof removeUE>>
export type GetUEsDto = Awaited<ReturnType<typeof getUEs>>
export type GetProgramUEsDto = Awaited<ReturnType<typeof getProgramUEs>>
export type GetUEByCodeDto = Awaited<ReturnType<typeof getUEByCode>>

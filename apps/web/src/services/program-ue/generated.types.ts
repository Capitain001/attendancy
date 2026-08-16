// ⚠ Fichier généré automatiquement — NE PAS ÉDITER À LA MAIN
// Régénérer : npx tsx scripts/generate/types/types.ts program-ue
// Pour surcharger un type, définissez-le dans ./types.ts (jamais écrasé).

import { addUEToProgram, removeUEFromProgram, updateProgramUE, getProgramUEs } from './database'

export type AddUEToProgramDto = Awaited<ReturnType<typeof addUEToProgram>>
export type RemoveUEFromProgramDto = Awaited<ReturnType<typeof removeUEFromProgram>>
export type UpdateProgramUEDto = Awaited<ReturnType<typeof updateProgramUE>>
export type GetProgramUEsDto = Awaited<ReturnType<typeof getProgramUEs>>

// ⚠ Fichier généré automatiquement — NE PAS ÉDITER À LA MAIN
// Régénérer : npx tsx scripts/generate/types/types.ts program
// Pour surcharger un type, définissez-le dans ./types.ts (jamais écrasé).

import { getPrograms, getProgramById, getProgramList, getClassProgram } from './database'

export type GetProgramsDto = Awaited<ReturnType<typeof getPrograms>>
export type GetProgramByIdDto = Awaited<ReturnType<typeof getProgramById>>
export type GetProgramListDto = Awaited<ReturnType<typeof getProgramList>>
export type GetClassProgramDto = Awaited<ReturnType<typeof getClassProgram>>

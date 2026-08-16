// ⚠ Fichier généré automatiquement — NE PAS ÉDITER À LA MAIN
// Régénérer : npx tsx scripts/generate/types/types.ts program
// Pour surcharger un type, définissez-le dans ./types.ts (jamais écrasé).

import { createProgram, updateProgram, removeProgram, toggleProgramLock, toggleProgramActive, duplicateProgram, getPrograms, getProgramById, getProgramList, getClassProgram } from './database'

export type CreateProgramDto = Awaited<ReturnType<typeof createProgram>>
export type UpdateProgramDto = Awaited<ReturnType<typeof updateProgram>>
export type RemoveProgramDto = Awaited<ReturnType<typeof removeProgram>>
export type ToggleProgramLockDto = Awaited<ReturnType<typeof toggleProgramLock>>
export type ToggleProgramActiveDto = Awaited<ReturnType<typeof toggleProgramActive>>
export type DuplicateProgramDto = Awaited<ReturnType<typeof duplicateProgram>>
export type GetProgramsDto = Awaited<ReturnType<typeof getPrograms>>
export type GetProgramByIdDto = Awaited<ReturnType<typeof getProgramById>>
export type GetProgramListDto = Awaited<ReturnType<typeof getProgramList>>
export type GetClassProgramDto = Awaited<ReturnType<typeof getClassProgram>>

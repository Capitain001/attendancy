// ⚠ Fichier généré automatiquement — NE PAS ÉDITER À LA MAIN
// Régénérer : npx tsx scripts/generate/types/types.ts function
// Pour surcharger un type, définissez-le dans ./types.ts (jamais écrasé).

import { createFunction, updateFunction, deleteFunction, assignFunctionToUser, removeFunctionFromUser, getFunctions, getFunctionByName, getFunctionsByNames, getFunctionProfiles } from './database'

export type CreateFunctionDto = Awaited<ReturnType<typeof createFunction>>
export type UpdateFunctionDto = Awaited<ReturnType<typeof updateFunction>>
export type DeleteFunctionDto = Awaited<ReturnType<typeof deleteFunction>>
export type AssignFunctionToUserDto = Awaited<ReturnType<typeof assignFunctionToUser>>
export type RemoveFunctionFromUserDto = Awaited<ReturnType<typeof removeFunctionFromUser>>
export type GetFunctionsDto = Awaited<ReturnType<typeof getFunctions>>
export type GetFunctionByNameDto = Awaited<ReturnType<typeof getFunctionByName>>
export type GetFunctionsByNamesDto = Awaited<ReturnType<typeof getFunctionsByNames>>
export type GetFunctionProfilesDto = Awaited<ReturnType<typeof getFunctionProfiles>>

// ⚠ Fichier généré automatiquement — NE PAS ÉDITER À LA MAIN
// Régénérer : npx tsx scripts/generate/types/types.ts function
// Pour surcharger un type, définissez-le dans ./types.ts (jamais écrasé).

import { createFunction, updateFunction, deleteFunction, assignFunctionToUser, deleteFunctionFromUser, removeFunctionFromUser, createMainFunctions, ensureMainFunctions, getFunctions, getFunctionByName, getFunctionsByNames, getFunctionProfiles, getUserFunctions, checkExistingMainFunctions, getMissingMainFunctions, getFunctionDetail } from './database'

export type CreateFunctionDto = Awaited<ReturnType<typeof createFunction>>
export type UpdateFunctionDto = Awaited<ReturnType<typeof updateFunction>>
export type DeleteFunctionDto = Awaited<ReturnType<typeof deleteFunction>>
export type AssignFunctionToUserDto = Awaited<ReturnType<typeof assignFunctionToUser>>
export type DeleteFunctionFromUserDto = Awaited<ReturnType<typeof deleteFunctionFromUser>>
export type RemoveFunctionFromUserDto = Awaited<ReturnType<typeof removeFunctionFromUser>>
export type CreateMainFunctionsDto = Awaited<ReturnType<typeof createMainFunctions>>
export type EnsureMainFunctionsDto = Awaited<ReturnType<typeof ensureMainFunctions>>
export type GetFunctionsDto = Awaited<ReturnType<typeof getFunctions>>
export type GetFunctionByNameDto = Awaited<ReturnType<typeof getFunctionByName>>
export type GetFunctionsByNamesDto = Awaited<ReturnType<typeof getFunctionsByNames>>
export type GetFunctionProfilesDto = Awaited<ReturnType<typeof getFunctionProfiles>>
export type GetUserFunctionsDto = Awaited<ReturnType<typeof getUserFunctions>>
export type CheckExistingMainFunctionsDto = Awaited<ReturnType<typeof checkExistingMainFunctions>>
export type GetMissingMainFunctionsDto = Awaited<ReturnType<typeof getMissingMainFunctions>>
export type GetFunctionDetailDto = Awaited<ReturnType<typeof getFunctionDetail>>

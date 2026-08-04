// ⚠ Fichier généré automatiquement — NE PAS ÉDITER À LA MAIN
// Régénérer : npx tsx scripts/generate/types/types.ts function
// Pour surcharger un type, définissez-le dans ./types.ts (jamais écrasé).

import { getFunctions, getFunctionByName, getFunctionsByNames, getFunctionProfiles } from './database'

export type GetFunctionsDto = Awaited<ReturnType<typeof getFunctions>>
export type GetFunctionByNameDto = Awaited<ReturnType<typeof getFunctionByName>>
export type GetFunctionsByNamesDto = Awaited<ReturnType<typeof getFunctionsByNames>>
export type GetFunctionProfilesDto = Awaited<ReturnType<typeof getFunctionProfiles>>

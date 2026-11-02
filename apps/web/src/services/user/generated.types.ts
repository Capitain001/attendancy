// ⚠ Fichier généré automatiquement — NE PAS ÉDITER À LA MAIN
// Régénérer : npx tsx scripts/generate/types/types.ts user
// Pour surcharger un type, définissez-le dans ./types.ts (jamais écrasé).

import { updateUserProfile, updateUser } from './database'

export type UpdateUserProfileDto = Awaited<ReturnType<typeof updateUserProfile>>
export type UpdateUserDto = Awaited<ReturnType<typeof updateUser>>

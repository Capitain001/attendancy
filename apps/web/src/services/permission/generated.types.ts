// ⚠ Fichier généré automatiquement — NE PAS ÉDITER À LA MAIN
// Régénérer : npx tsx scripts/generate/types/types.ts permission
// Pour surcharger un type, définissez-le dans ./types.ts (jamais écrasé).

import { grantPermission, revokePermission, getUserPermissions, getFunctionPermissions, getEffectivePermissionNames } from './database'

export type GrantPermissionDto = Awaited<ReturnType<typeof grantPermission>>
export type RevokePermissionDto = Awaited<ReturnType<typeof revokePermission>>
export type GetUserPermissionsDto = Awaited<ReturnType<typeof getUserPermissions>>
export type GetFunctionPermissionsDto = Awaited<ReturnType<typeof getFunctionPermissions>>
export type GetEffectivePermissionNamesDto = Awaited<ReturnType<typeof getEffectivePermissionNames>>

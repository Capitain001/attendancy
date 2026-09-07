// ⚠ Fichier généré automatiquement — NE PAS ÉDITER À LA MAIN
// Régénérer : npx tsx scripts/generate/types/types.ts user-organization
// Pour surcharger un type, définissez-le dans ./types.ts (jamais écrasé).

import { suspendOrgUser, activateOrgUser, reintegrateUserOrganization, getUserOrganizations } from './database'

export type SuspendOrgUserDto = Awaited<ReturnType<typeof suspendOrgUser>>
export type ActivateOrgUserDto = Awaited<ReturnType<typeof activateOrgUser>>
export type ReintegrateUserOrganizationDto = Awaited<ReturnType<typeof reintegrateUserOrganization>>
export type GetUserOrganizationsDto = Awaited<ReturnType<typeof getUserOrganizations>>

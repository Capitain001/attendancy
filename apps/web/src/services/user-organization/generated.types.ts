// ⚠ Fichier généré automatiquement — NE PAS ÉDITER À LA MAIN
// Régénérer : npx tsx scripts/generate/types/types.ts user-organization
// Pour surcharger un type, définissez-le dans ./types.ts (jamais écrasé).

import { suspendOrgUser, activateOrgUser, reintegrateUserOrganization, ensureUserOrganization, getUserOrganizations, isOrgMember } from './database'

export type SuspendOrgUserDto = Awaited<ReturnType<typeof suspendOrgUser>>
export type ActivateOrgUserDto = Awaited<ReturnType<typeof activateOrgUser>>
export type ReintegrateUserOrganizationDto = Awaited<ReturnType<typeof reintegrateUserOrganization>>
export type EnsureUserOrganizationDto = Awaited<ReturnType<typeof ensureUserOrganization>>
export type GetUserOrganizationsDto = Awaited<ReturnType<typeof getUserOrganizations>>
export type IsOrgMemberDto = Awaited<ReturnType<typeof isOrgMember>>

// ⚠ Fichier généré automatiquement — NE PAS ÉDITER À LA MAIN
// Régénérer : npx tsx scripts/generate/types/types.ts direction
// Pour surcharger un type, définissez-le dans ./types.ts (jamais écrasé).

import { assignFunctionsToMember, revokeFunctionsFromMember, updateMemberFunctions, removeDirectionMember, getDirectionMembers, getDirectionMember, getDirectionMemberByUserId } from './database'

export type AssignFunctionsToMemberDto = Awaited<ReturnType<typeof assignFunctionsToMember>>
export type RevokeFunctionsFromMemberDto = Awaited<ReturnType<typeof revokeFunctionsFromMember>>
export type UpdateMemberFunctionsDto = Awaited<ReturnType<typeof updateMemberFunctions>>
export type RemoveDirectionMemberDto = Awaited<ReturnType<typeof removeDirectionMember>>
export type GetDirectionMembersDto = Awaited<ReturnType<typeof getDirectionMembers>>
export type GetDirectionMemberDto = Awaited<ReturnType<typeof getDirectionMember>>
export type GetDirectionMemberByUserIdDto = Awaited<ReturnType<typeof getDirectionMemberByUserId>>

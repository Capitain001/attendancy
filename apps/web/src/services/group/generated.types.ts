// ⚠ Fichier généré automatiquement — NE PAS ÉDITER À LA MAIN
// Régénérer : npx tsx scripts/generate/types/types.ts group
// Pour surcharger un type, définissez-le dans ./types.ts (jamais écrasé).

import { createGroup, updateGroup, setGroupStudents, removeGroup, getGroupsByClass, getGroupEligibleStudents } from './database'

export type CreateGroupDto = Awaited<ReturnType<typeof createGroup>>
export type UpdateGroupDto = Awaited<ReturnType<typeof updateGroup>>
export type SetGroupStudentsDto = Awaited<ReturnType<typeof setGroupStudents>>
export type RemoveGroupDto = Awaited<ReturnType<typeof removeGroup>>
export type GetGroupsByClassDto = Awaited<ReturnType<typeof getGroupsByClass>>
export type GetGroupEligibleStudentsDto = Awaited<ReturnType<typeof getGroupEligibleStudents>>

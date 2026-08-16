// ⚠ Fichier généré automatiquement — NE PAS ÉDITER À LA MAIN
// Régénérer : npx tsx scripts/generate/types/types.ts parent
// Pour surcharger un type, définissez-le dans ./types.ts (jamais écrasé).

import { createParentRelationWithAudit, deleteParentRelationWithAudit, getParentStudents, searchEligibleParents, getParentUserIdsForStudents } from './database'

export type CreateParentRelationWithAuditDto = Awaited<ReturnType<typeof createParentRelationWithAudit>>
export type DeleteParentRelationWithAuditDto = Awaited<ReturnType<typeof deleteParentRelationWithAudit>>
export type GetParentStudentsDto = Awaited<ReturnType<typeof getParentStudents>>
export type SearchEligibleParentsDto = Awaited<ReturnType<typeof searchEligibleParents>>
export type GetParentUserIdsForStudentsDto = Awaited<ReturnType<typeof getParentUserIdsForStudents>>

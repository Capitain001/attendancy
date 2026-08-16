// ⚠ Fichier généré automatiquement — NE PAS ÉDITER À LA MAIN
// Régénérer : npx tsx scripts/generate/types/types.ts department
// Pour surcharger un type, définissez-le dans ./types.ts (jamais écrasé).

import { createDepartment, updateDepartment, deleteDepartment, getDepartments } from './database'

export type CreateDepartmentDto = Awaited<ReturnType<typeof createDepartment>>
export type UpdateDepartmentDto = Awaited<ReturnType<typeof updateDepartment>>
export type DeleteDepartmentDto = Awaited<ReturnType<typeof deleteDepartment>>
export type GetDepartmentsDto = Awaited<ReturnType<typeof getDepartments>>

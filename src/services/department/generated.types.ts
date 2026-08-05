// ⚠ Fichier généré automatiquement — NE PAS ÉDITER À LA MAIN
// Régénérer : npx tsx scripts/generate/types/types.ts department
// Pour surcharger un type, définissez-le dans ./types.ts (jamais écrasé).

import { getDepartments } from './database'

export type GetDepartmentsDto = Awaited<ReturnType<typeof getDepartments>>

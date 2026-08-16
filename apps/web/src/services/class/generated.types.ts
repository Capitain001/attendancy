// ⚠ Fichier généré automatiquement — NE PAS ÉDITER À LA MAIN
// Régénérer : npx tsx scripts/generate/types/types.ts class
// Pour surcharger un type, définissez-le dans ./types.ts (jamais écrasé).

import { createClass, updateClass, removeClass, getClasses, getClass } from './database'

export type CreateClassDto = Awaited<ReturnType<typeof createClass>>
export type UpdateClassDto = Awaited<ReturnType<typeof updateClass>>
export type RemoveClassDto = Awaited<ReturnType<typeof removeClass>>
export type GetClassesDto = Awaited<ReturnType<typeof getClasses>>
export type GetClassDto = Awaited<ReturnType<typeof getClass>>

// src/features/personal/services/class/generated.types.ts
// ⚠ Fichier généré automatiquement — NE PAS ÉDITER À LA MAIN
// Régénérer : npx tsx scripts/generate/types/types.ts src/features/personal/services/class
// Pour surcharger un type, définissez-le dans ./types.ts (jamais écrasé).

import { invalidatePersonalClassEvents, createPersonalClass, updatePersonalClass, getDefaultPersonalClass, getPersonalClasses } from './database'

export type InvalidatePersonalClassEventsDto = Awaited<ReturnType<typeof invalidatePersonalClassEvents>>
export type CreatePersonalClassDto = Awaited<ReturnType<typeof createPersonalClass>>
export type UpdatePersonalClassDto = Awaited<ReturnType<typeof updatePersonalClass>>
export type GetDefaultPersonalClassDto = Awaited<ReturnType<typeof getDefaultPersonalClass>>
export type GetPersonalClassesDto = Awaited<ReturnType<typeof getPersonalClasses>>

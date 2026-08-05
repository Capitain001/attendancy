// ⚠ Fichier généré automatiquement — NE PAS ÉDITER À LA MAIN
// Régénérer : npx tsx scripts/generate/types/types.ts event
// Pour surcharger un type, définissez-le dans ./types.ts (jamais écrasé).

import { getEvents, getEvent } from './database'

export type GetEventsDto = Awaited<ReturnType<typeof getEvents>>
export type GetEventDto = Awaited<ReturnType<typeof getEvent>>

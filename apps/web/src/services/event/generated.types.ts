// ⚠ Fichier généré automatiquement — NE PAS ÉDITER À LA MAIN
// Régénérer : npx tsx scripts/generate/types/types.ts event
// Pour surcharger un type, définissez-le dans ./types.ts (jamais écrasé).

import { createEvent, updateEvent, removeEventDb, getEvents, getEvent } from './database'

export type CreateEventDto = Awaited<ReturnType<typeof createEvent>>
export type UpdateEventDto = Awaited<ReturnType<typeof updateEvent>>
export type RemoveEventDbDto = Awaited<ReturnType<typeof removeEventDb>>
export type GetEventsDto = Awaited<ReturnType<typeof getEvents>>
export type GetEventDto = Awaited<ReturnType<typeof getEvent>>

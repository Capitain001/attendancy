// ⚠ Fichier généré automatiquement — NE PAS ÉDITER À LA MAIN
// Régénérer : npx tsx scripts/generate/types/types.ts room
// Pour surcharger un type, définissez-le dans ./types.ts (jamais écrasé).

import { getRooms, getRoomById, getLocations } from './database'

export type GetRoomsDto = Awaited<ReturnType<typeof getRooms>>
export type GetRoomByIdDto = Awaited<ReturnType<typeof getRoomById>>
export type GetLocationsDto = Awaited<ReturnType<typeof getLocations>>

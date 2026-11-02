// ⚠ Fichier généré automatiquement — NE PAS ÉDITER À LA MAIN
// Régénérer : npx tsx scripts/generate/types/types.ts room
// Pour surcharger un type, définissez-le dans ./types.ts (jamais écrasé).

import { createRoom, removeRoom, createLocation, updateRoom, toggleLocationActive, getRooms, getRoomById, getLocations } from './database'

export type CreateRoomDto = Awaited<ReturnType<typeof createRoom>>
export type RemoveRoomDto = Awaited<ReturnType<typeof removeRoom>>
export type CreateLocationDto = Awaited<ReturnType<typeof createLocation>>
export type UpdateRoomDto = Awaited<ReturnType<typeof updateRoom>>
export type ToggleLocationActiveDto = Awaited<ReturnType<typeof toggleLocationActive>>
export type GetRoomsDto = Awaited<ReturnType<typeof getRooms>>
export type GetRoomByIdDto = Awaited<ReturnType<typeof getRoomById>>
export type GetLocationsDto = Awaited<ReturnType<typeof getLocations>>

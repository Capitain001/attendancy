import type { getRooms, getRoomById, getLocations } from './database'

export type GetRoomsDto     = Awaited<ReturnType<typeof getRooms>>
export type GetRoomByIdDto  = Awaited<ReturnType<typeof getRoomById>>
export type GetLocationsDto = Awaited<ReturnType<typeof getLocations>>
export type RoomItem = GetRoomsDto[number]
export type RoomDTo  = RoomItem

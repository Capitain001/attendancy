import type { getRooms, getRoomById, getLocations } from './database'

export type RoomItem = GetRoomsDto[number]
export type RoomDTo  = RoomItem
export * from './generated.types'

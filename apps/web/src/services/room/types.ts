import type { Prisma } from '@/generated/prisma/client'
import type { getRooms, getRoomById, getLocations } from './database'
import { GetRoomsDto } from './generated.types'

export type RoomItem = GetRoomsDto[number]
export type RoomDTo  = RoomItem
export * from './generated.types'

export type CreateRoomData = Pick<Prisma.RoomUncheckedCreateInput, 'name' | 'capacity' | 'locationId' | 'equipment'>
export type UpdateRoomData = Partial<CreateRoomData>

export type CreateLocationData = Pick<Prisma.LocationUncheckedCreateInput, 'name' | 'address' | 'latitude' | 'longitude' | 'radius'>

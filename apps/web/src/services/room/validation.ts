// src/services/room/validation.ts
import { object, string, pipe, trim, minLength, maxLength, optional, number, minValue, maxValue, array, uuid } from 'valibot'
import type { InferInput, InferOutput } from 'valibot'
import { validateWithId } from '@/utils/server/validation'
import type { CreateRoomData, UpdateRoomData, CreateLocationData } from './types'

export const createRoomSchema = object({
  name: pipe(string(), trim(), minLength(1, 'Nom requis'), maxLength(100)),
  capacity: optional(pipe(number(), minValue(1), maxValue(10000))),
  locationId: optional(pipe(string(), trim())),
  equipment: optional(array(string())),
} satisfies Record<keyof CreateRoomData, unknown>)

export const createLocationSchema = object({
  name: pipe(string(), trim(), minLength(1, 'Nom requis'), maxLength(100)),
  address: pipe(string(), trim(), minLength(1, 'Adresse requise')),
  latitude: pipe(number(), minValue(-90), maxValue(90)),
  longitude: pipe(number(), minValue(-180), maxValue(180)),
  radius: optional(pipe(number(), minValue(10), maxValue(5000))),
} satisfies Record<keyof CreateLocationData, unknown>)

export type CreateRoomInput  = InferInput<typeof createRoomSchema>
export type CreateRoomOutput = InferOutput<typeof createRoomSchema>
export type CreateLocationInput  = InferInput<typeof createLocationSchema>
export type CreateLocationOutput = InferOutput<typeof createLocationSchema>

export const updateRoomDataSchema = object({
  name: optional(pipe(string(), trim(), minLength(1, 'Nom requis'), maxLength(100))),
  capacity: optional(pipe(number(), minValue(1), maxValue(10000))),
  locationId: optional(pipe(string(), trim())),
  equipment: optional(array(string())),
} satisfies Record<keyof UpdateRoomData, unknown>)

export type UpdateRoomDataInput = InferInput<typeof updateRoomDataSchema>
export type UpdateRoomDataOutput = InferOutput<typeof updateRoomDataSchema>

export const updateRoomSchema = validateWithId('roomId', updateRoomDataSchema)

export type UpdateRoomInput = InferInput<typeof updateRoomSchema>
export type UpdateRoomOutput = InferOutput<typeof updateRoomSchema>

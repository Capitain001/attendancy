import * as v from 'valibot'
import { validateWithId } from '@/utils/server/validation'
import { CHANNEL_NAME_MAX_LENGTH, CHANNEL_TYPES } from './constants'
import type { CreateChannelData, UpdateChannelData } from './types'

const channelNameSchema = v.pipe(
  v.string(),
  v.trim(),
  v.minLength(1, 'Nom requis'),
  v.maxLength(CHANNEL_NAME_MAX_LENGTH),
)

const channelTargetIdSchema = v.pipe(v.string(), v.uuid('ID invalide'))

export const createChannelSchema = v.pipe(
  v.object({
    type: v.picklist(CHANNEL_TYPES, 'Type de channel invalide'),
    name: v.optional(v.nullable(channelNameSchema)),
    isPrivate: v.optional(v.boolean()),
    classId: v.optional(v.nullable(channelTargetIdSchema)),
    groupId: v.optional(v.nullable(channelTargetIdSchema)),
  } satisfies Record<keyof CreateChannelData, unknown>),
  v.check(
    (channel) => channel.type !== 'CLASS' || Boolean(channel.classId),
    'classId requis pour un channel CLASS',
  ),
  v.check(
    (channel) => channel.type !== 'GROUP' || Boolean(channel.groupId),
    'groupId requis pour un channel GROUP',
  ),
  v.check(
    (channel) => !(channel.classId && channel.groupId),
    'Un channel ne peut cibler à la fois une classe et un groupe',
  ),
)

export type CreateChannelInput = v.InferInput<typeof createChannelSchema>
export type CreateChannelOutput = v.InferOutput<typeof createChannelSchema>

export const updateChannelDataSchema = v.object({
  name: v.optional(v.nullable(channelNameSchema)),
  isPrivate: v.optional(v.boolean()),
} satisfies Record<keyof UpdateChannelData, unknown>)

export type UpdateChannelDataInput = v.InferInput<typeof updateChannelDataSchema>
export type UpdateChannelDataOutput = v.InferOutput<typeof updateChannelDataSchema>

export const updateChannelSchema = validateWithId('channelId', updateChannelDataSchema)

export type UpdateChannelInput = v.InferInput<typeof updateChannelSchema>
export type UpdateChannelOutput = v.InferOutput<typeof updateChannelSchema>

// Id seul : utilisé par get / remove (convention toDeleteFn : l'action reçoit l'id).
export const channelIdSchema = v.pipe(v.string(), v.uuid('ID invalide'))

export type ChannelIdInput = v.InferInput<typeof channelIdSchema>
export type ChannelIdOutput = v.InferOutput<typeof channelIdSchema>
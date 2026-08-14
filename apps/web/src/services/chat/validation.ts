// src/services/chat/validation.ts
import * as v from 'valibot'
import type { InferInput, InferOutput } from 'valibot'
import { validateWithId } from '@/utils/server/validation'
import type { CreateMessageData, UpdateMessageData } from './types'

export const createMessageSchema = v.object({
  content: v.pipe(v.string(), v.trim(), v.minLength(1, 'Le message ne peut pas être vide')),
  channelId: v.pipe(v.string(), v.uuid('ID de canal invalide')),
  parentId: v.optional(v.nullable(v.pipe(v.string(), v.uuid('ID parent invalide')))),
} satisfies Record<keyof CreateMessageData, unknown>)

export type CreateMessageInput = InferInput<typeof createMessageSchema>
export type CreateMessageOutput = InferOutput<typeof createMessageSchema>

export const updateMessageDataSchema = v.object({
  content: v.optional(v.pipe(v.string(), v.trim(), v.minLength(1, 'Le message ne peut pas être vide'))),
} satisfies Record<keyof UpdateMessageData, unknown>)

export type UpdateMessageDataInput = InferInput<typeof updateMessageDataSchema>
export type UpdateMessageDataOutput = InferOutput<typeof updateMessageDataSchema>

export const updateMessageSchema = validateWithId('messageId', updateMessageDataSchema)

export type UpdateMessageInput = InferInput<typeof updateMessageSchema>
export type UpdateMessageOutput = InferOutput<typeof updateMessageSchema>

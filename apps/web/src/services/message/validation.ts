// src/services/chat/validation.ts
import * as v from 'valibot'
import { validateWithId } from '@/utils/server/validation'
import type { CreateMessageData, UpdateMessageData } from './types'

// Entrée client pour l'envoi d'un message.
//
// le client génère lui-même l'id (crypto.randomUUID()) et la
// date de rédaction. L'id est obligatoire : il sert de clé d'idempotence pour
// TOUS les envois, en ligne comme hors ligne. Renvoyer le même message après un
// timeout réseau ne crée jamais de doublon (voir createMessage).
//
// createdAt est une donnée déclarée par le client : elle est validée ici sur la
// forme, et bornée par la policy R3 (ni futur, ni trop ancienne) pour ne pas
// fausser l'ordre du canal. Absente : la base met now().
//
// Ne figurent volontairement PAS dans l'entrée : userId et orgId (issus de la
// session) et signature (posée uniquement par le relais serveur).
export const createMessageSchema = v.object({
  id: v.pipe(v.string(), v.uuid('ID de message invalide')),
  createdAt: v.optional(
    v.pipe(
      v.string(),
      v.isoTimestamp('Date invalide'),
      v.transform((s) => new Date(s)),
      // Garde-fou : une chaîne bien formée peut quand même donner une date invalide.
      v.check((d) => !Number.isNaN(d.getTime()), 'Date invalide'),
    ),
  ),
  // 4000 caractères max : borne la taille des messages stockés et relayés.
  content: v.pipe(
    v.string(),
    v.trim(),
    v.minLength(1, 'Le message ne peut pas être vide'),
    v.maxLength(4000, 'Message trop long'),
  ),
  channelId: v.pipe(v.string(), v.uuid('ID de canal invalide')),
  // Réponse dans un fil : null ou absent = message racine.
  parentId: v.optional(v.nullable(v.pipe(v.string(), v.uuid('ID parent invalide')))),
} satisfies Record<keyof CreateMessageData, unknown>)

export type CreateMessageInput = v.InferInput<typeof createMessageSchema>
export type CreateMessageOutput = v.InferOutput<typeof createMessageSchema>

export const updateMessageDataSchema = v.object({
  content: v.optional(
    v.pipe(
      v.string(),
      v.trim(),
      v.minLength(1, 'Le message ne peut pas être vide'),
      v.maxLength(4000, 'Message trop long'),
    ),
  ),
} satisfies Record<keyof UpdateMessageData, unknown>)

export type UpdateMessageDataInput = v.InferInput<typeof updateMessageDataSchema>
export type UpdateMessageDataOutput = v.InferOutput<typeof updateMessageDataSchema>

export const updateMessageSchema = validateWithId('messageId', updateMessageDataSchema)

export type UpdateMessageInput = v.InferInput<typeof updateMessageSchema>
export type UpdateMessageOutput = v.InferOutput<typeof updateMessageSchema>

export const getMessagesSchema = v.object({
  channelId: v.pipe(v.string(), v.uuid('ID de canal invalide')),
})

export type GetMessagesInput = v.InferInput<typeof getMessagesSchema>
export type GetMessagesOutput = v.InferOutput<typeof getMessagesSchema>
// services/notification/domains/chat/validation.ts
import * as v from 'valibot'

export const notifyChannelMembersSchema = v.object({
  channelId: v.pipe(v.string(), v.uuid('ID de canal invalide')),
  messageId: v.pipe(v.string(), v.uuid('ID de message invalide')),
  // Pas de `content` : le texte vient de la base, jamais du client.
  // `excludedIds` ne peut que réduire la liste des destinataires, jamais l'élargir.
  excludedIds: v.optional(v.pipe(v.array(v.pipe(v.string(), v.uuid())), v.maxLength(500)), []),
})

export type NotifyChannelMembersInput = v.InferInput<typeof notifyChannelMembersSchema>
export type NotifyChannelMembersOutput = v.InferOutput<typeof notifyChannelMembersSchema>
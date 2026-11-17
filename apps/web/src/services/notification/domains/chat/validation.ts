import * as v from 'valibot'
import { MAX_NOTIFICATION_MESSAGE } from './constants'

export const sendParticipantNotificationsSchema = v.object({
  channelId: v.pipe(v.string(), v.uuid('ID de canal invalide')),
  messageId: v.pipe(v.string(), v.uuid('ID de message invalide')),
  // Tronqué (et non rejeté) : le texte du message peut dépasser la taille d'une notification.
  // Le trim et le minLength passent avant, pour ne pas tronquer un contenu vide.
  content: v.pipe(
    v.string(),
    v.trim(),
    v.minLength(1, 'Message requis'),
    v.transform((text) => text.slice(0, MAX_NOTIFICATION_MESSAGE)),
  ),
  excludedIds: v.optional(v.pipe(v.array(v.pipe(v.string(), v.uuid())), v.maxLength(500)), []),
})

export type SendParticipantNotificationsInput = v.InferInput<typeof sendParticipantNotificationsSchema>
export type SendParticipantNotificationsOutput = v.InferOutput<typeof sendParticipantNotificationsSchema>
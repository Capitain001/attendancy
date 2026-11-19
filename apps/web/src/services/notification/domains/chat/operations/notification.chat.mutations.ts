// services/notification/domains/chat/operations/notification.chat.mutations.ts
import 'server-only'
import { getChannelRecipients } from '@/services/channel-member/server'
import { sendPushNotificationToUserById } from '@/services/notification/server'
import { buildMessage } from '@/services/notification/messages/message.messages'

import { MAX_NOTIFICATION_MESSAGE } from '../constants'
import type { NotifyChannelMembersOutput } from '../validation'

type NotifyChannelMembersParams = NotifyChannelMembersOutput & {
  orgId: string
  senderId: string
  senderName: string
  content: string // lu en base par l'appelant, jamais fourni par le client
  // Auteur du message cité, null si pas une réponse (ou parent supprimé / sans auteur)
  parentUserId: string | null
}

/**
 * Notifie les membres du canal, hors expéditeur, hors `excludedIds` et hors sourdine.
 * Une réponse directe traverse la sourdine du canal.
 * Ne vérifie AUCUN droit : l'appelant a établi l'appartenance au canal et la paternité du message.
 * Best-effort : un échec de push n'est pas remonté.
 */
export async function notifyChannelMembers({
  orgId,
  channelId,
  messageId,
  content,
  senderId,
  senderName,
  parentUserId,
  excludedIds,
}: NotifyChannelMembersParams) {
  const members = await getChannelRecipients({
    channelId,
    excludedIds: [senderId, ...excludedIds],
  })

  // Sourdine : coupe le canal, sauf pour l'auteur du message cité. `parentUserId` ne correspond
  // à un membre de la liste que s'il est encore membre et non exclu : pas de contrôle en plus.
  const recipientIds = members
    .filter((member) => !member.mutedAt || member.userId === parentUserId)
    .map((member) => member.userId)

  const preview = content.slice(0, MAX_NOTIFICATION_MESSAGE)

  await Promise.allSettled(
    recipientIds.map((userId) =>
      sendPushNotificationToUserById(userId, {
        orgId,
        // Le texte dépend du destinataire : la règle vit dans buildMessage
        message: buildMessage({ recipientId: userId, parentUserId, senderName, preview }),
        resourceType: 'MESSAGE',
        resourceId: messageId,
        event: 'CREATED',
        metadata: { channelId },
      }),
    ),
  )
}

import 'server-only'
import { getChannelMemberIds } from '@/services/channel-member/server'
import { sendPushNotificationToUserById } from '@/services/notification/server'
import type { SendParticipantNotificationsOutput } from '../validation'

type SendParticipantNotificationsParams = SendParticipantNotificationsOutput & {
  senderId: string
}

export async function sendParticipantNotifications({
  channelId,
  messageId,
  content, // déjà tronqué par le schéma
  excludedIds,
  senderId,
}: SendParticipantNotificationsParams) {
  const recipientIds = await getChannelMemberIds({
    channelId,
    excludedIds: [senderId, ...excludedIds],
  })

  await Promise.allSettled(
    recipientIds.map((userId) =>
      sendPushNotificationToUserById(userId, {
        message: content,
        resourceType: 'MESSAGE',
        resourceId: messageId,
        event: 'CREATED',
        metadata: { channelId },
      }),
    ),
  )
}
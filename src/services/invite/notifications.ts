// src/services/invite/notifications.ts
// Notifications fire-and-forget — port de V1 adapté V2.
// sendPushNotificationToUserById est un stub jusqu'à l'implémentation du service push.
import { prisma } from '@/lib/prisma'
import { sendPushNotificationToUserById } from '@/services/notification/user'

export type InvitationNotifyEvent = 'CREATED' | 'RESENT' | 'LINK_GENERATED'

const DIRECTION_NOTIFY_FUNCTIONS = ['PRINCIPAL', 'SECRETARY'] as const

function buildMessage(event: InvitationNotifyEvent, invitedEmail: string): string {
  switch (event) {
    case 'CREATED': return `Invitation envoyée à ${invitedEmail}`
    case 'RESENT': return `Invitation renvoyée pour ${invitedEmail}`
    case 'LINK_GENERATED': return `Lien d'invitation généré pour ${invitedEmail}`
  }
}

export async function notifyInvitationStakeholders(params: {
  invitationId: string
  orgId: string
  actorId: string
  event: InvitationNotifyEvent
  invitedEmail: string
  classId?: string
}): Promise<void> {
  try {
    const { invitationId, orgId, actorId, event, invitedEmail } = params

    const directionRows = await prisma.userOrganization.findMany({
      where: {
        orgId,
        role: 'DIRECTION',
        user: {
          functions: {
            some: {
              function: { orgId, name: { in: [...DIRECTION_NOTIFY_FUNCTIONS] } },
            },
          },
        },
      },
      select: { userId: true },
      distinct: ['userId'],
    })

    const recipientIds = new Set<string>([actorId])
    for (const row of directionRows) recipientIds.add(row.userId)

    const message = buildMessage(event, invitedEmail)

    await Promise.allSettled(
      [...recipientIds].map((userId) =>
        sendPushNotificationToUserById(userId, { message })
      )
    )
  } catch (error) {
    console.error('[notifyInvitationStakeholders]', error)
  }
}

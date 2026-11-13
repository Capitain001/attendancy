// src/services/notification/types.ts
export * from './generated.types'

import type { Prisma } from '@/generated/prisma/client'
import type { Resource, NotificationEvent } from '@/generated/prisma/browser'
import type { InvitationAction } from '@/modules/invitation/constants'
import type { getNotificationsForUser } from './database/notification.queries'
import type { getPushSubscriptionsByUserId } from './database/push.queries'

// Types dérivés Prisma — propres à ce service
export type NotificationItem = Awaited<ReturnType<typeof getNotificationsForUser>>[number]
export type PushSubscriptionItem = Awaited<ReturnType<typeof getPushSubscriptionsByUserId>>[number]

/** Ressource secondaire d'une notification (classe, cours, séance...). */
export type NotificationTarget = { type: Resource; id: string; name?: string }
/** Personne à l'origine d'une notification (inviteur, ou invité qui répond). */
export type SendBy = { id: string; name?: string | null; email?: string | null }

/** Forme de metadata selon la colonne resourceType. SCHEDULE et JUSTIFICATION n'en ont pas. */
export type NotificationMetadataByResource = {
  MESSAGE: { channelId: string }
  /** Personne à l'origine d'une notification (inviteur, ou invité qui répond). */

  INVITATION: {
    action: InvitationAction
    role?: string
    target?: NotificationTarget
    /** Qui a déclenché la notification : l'inviteur (CREATED) ou l'invité qui répond (CONFIRMED / REJECTED). */
    sendBy?: SendBy
    /** @deprecated lire l'invitation via resourceId */
    expiresAt?: string
    /** @deprecated réécrit par setInvitationNotificationStatus ; lire l'invitation via resourceId */
    status?: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'REVOKED'
  }
  ATTENDANCE: { target?: NotificationTarget }
  GRADE: { target?: NotificationTarget }
}

export type OpenMetadata = Record<string, unknown>

/**
 * Metadata d'une ressource : champs connus typés + champs ajoutés tolérés.
 * Ressource sans schéma : objet ouvert (lecture uniquement, voir NotificationPayload).
 */
export type NotificationMetadataFor<R extends Resource> =
  R extends keyof NotificationMetadataByResource
  ? NotificationMetadataByResource[R] & OpenMetadata
  : OpenMetadata

export type NotificationMetadata = NotificationMetadataFor<keyof NotificationMetadataByResource>

/**
 * Payload accepté par l'envoi serveur (jamais construit par un client).
 * resourceType et metadata sont liés : une ressource avec schéma exige ses champs,
 * une ressource sans schéma n'accepte pas de metadata.
 */
export type NotificationPayload = {
  message: string
  orgId?: string
  event?: NotificationEvent
} & (
    | {
      [R in keyof NotificationMetadataByResource]: {
        resourceType: R
        resourceId?: string
        metadata?: NotificationMetadataFor<R>
      }
    }[keyof NotificationMetadataByResource]
    | { resourceType?: Resource; resourceId?: string; metadata?: undefined }
  )

/** Ce qu'un admin peut saisir depuis l'UI : pas de metadata, pas d'orgId. */
export type AdminNotificationData = Pick<
  Prisma.NotificationUncheckedCreateInput,
  'message' | 'resourceType' | 'resourceId' | 'event'
>

export type NotificationStats = {
  total: number
  unread: number
  read: number
  byType: Partial<Record<string, number>>
  uniqueUsers: number
}

export type PushSubscriptionStats = {
  totalSubscriptions: number
  activeSubscriptions: number
  expiredSubscriptions: number
  uniqueUsers: number
}



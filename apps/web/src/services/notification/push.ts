// src/services/notification/push.ts
import { ERRORS } from '@/config'
import {
  isVapidConfigured,
  buildPushPayload,
  sendToDevice,
  analyzeSendResults,
} from '@/modules/notification/server'
import type { SendDeviceResult } from '@/modules/notification/types'
import { markSubscriptionExpired } from './database/push.mutations'
import { getActivePushSubscriptionsByUserId } from './database/push.queries'
import { createUserNotification } from './database/notification.mutations'
import type { NotificationPayload } from './types'

import { NOTIFICATION_CONFIG, NOTIFICATION_TITLES } from '@/config/notification'
import type { Resource } from '@/generated/prisma/browser'

export function resolveTitle(resourceType?: Resource): string {
  return resourceType && resourceType in NOTIFICATION_TITLES
    ? NOTIFICATION_TITLES[resourceType as keyof typeof NOTIFICATION_TITLES]
    : 'Notification 🔔'
}

/**
 * Persiste la notification en base + envoie un push à tous les appareils actifs.
 * Pas d'auth requise — fonction serveur interne (jamais exposée directement en Server Action).
 */
export async function sendPushNotificationToUserById(
  userId: string,
  payload: NotificationPayload,
) {
  try {
    if (!isVapidConfigured()) {
      return {
        success: false,
        error:
          'VAPID non configuré — vérifier NEXT_PUBLIC_VAPID_PUBLIC_KEY et VAPID_PRIVATE_KEY',
      }
    }

    await createUserNotification({ userId, data: payload })

    const subscriptions = await getActivePushSubscriptionsByUserId(userId)
    if (subscriptions.length === 0) {
      return {
        success: false,
        error: 'Aucun appareil push actif pour cet utilisateur',
      }
    }

    const pushPayload = buildPushPayload({
      title: resolveTitle(payload.resourceType),
      body: payload.message,
      icon: NOTIFICATION_CONFIG.defaultIcon,
      data: {
        userId,
        resourceType: payload.resourceType,
        resourceId: payload.resourceId,
        event: payload.event,
      },
    })
    const results = await Promise.allSettled(
      subscriptions.map((sub) => sendToDevice(sub, pushPayload)),
    )

    // Nettoyage des abonnements révoqués (410 Gone) — fire-and-forget
    results
      .filter(
        (r): r is PromiseFulfilledResult<SendDeviceResult> =>
          r.status === 'fulfilled' && r.value.shouldMarkExpired,
      )
      .forEach((r) => markSubscriptionExpired(r.value.endpoint).catch(() => { }))

    const { successful } = analyzeSendResults(results)
    return { success: successful > 0 }
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : ERRORS.SERVER,
    }
  }
}

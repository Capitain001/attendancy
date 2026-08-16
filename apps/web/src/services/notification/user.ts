'use server'
import * as v from 'valibot'
import { authAccess } from '@/services/auth'
import { ERRORS } from '@/config'
import {
  isVapidConfigured,
  buildPushPayload,
  sendToDevice,
  analyzeSendResults,
} from '@/modules/notification/server'
import { subscribeSchema } from '@/modules/notification'
import type { SerializedPushSubscription, SendDeviceResult } from '@/modules/notification/types'
import {
  upsertPushSubscription,
  unsubscribeDevice,
  unsubscribeAllDevices,
  markSubscriptionExpired,
} from './database/push.mutations'
import {
  getActivePushSubscriptionsByUserId,
  getPushSubscriptionsByUserId,
  getPushSubscriptionStats,
} from './database/push.queries'
import { createUserNotification } from './database/notification.mutations'

export type { SerializedPushSubscription }

// ─── Abonnement push ──────────────────────────────────────────────────────────

export async function subscribeUser(subscription: SerializedPushSubscription, userAgent?: string) {
  const auth = await authAccess()
  if (!auth.data) return { error: auth.error }
  const { user } = auth.data

  const parsed = v.safeParse(subscribeSchema, subscription)
  if (!parsed.success) return { error: parsed.issues[0]?.message ?? 'Données invalides' }

  try {
    await upsertPushSubscription({
      userId: user.id,
      endpoint: parsed.output.endpoint,
      p256dh: parsed.output.keys.p256dh,
      auth: parsed.output.keys.auth,
      userAgent,
    })
    return { data: true as const }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

export async function unsubscribeUser() {
  const auth = await authAccess()
  if (!auth.data) return { error: auth.error }
  const { user } = auth.data

  try {
    await unsubscribeAllDevices(user.id)
    return { data: true as const }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

export async function unsubscribeUserDevice(endpoint: string) {
  const auth = await authAccess()
  if (!auth.data) return { error: auth.error }
  const { user } = auth.data

  try {
    await unsubscribeDevice({ userId: user.id, endpoint })
    return { data: true as const }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

// ─── Envoi de notifications ───────────────────────────────────────────────────

/**
 * Persiste la notification en base + envoie un push à tous les appareils actifs.
 * Pas d'auth requise — appelable depuis d'autres services côté serveur.
 */
export async function sendPushNotificationToUserById(
  userId: string,
  payload: {
    message: string
    type?: string
    scheduleId?: string
    metadata?: Record<string, unknown>
  },
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!isVapidConfigured()) {
      return { success: false, error: 'VAPID non configuré — vérifier NEXT_PUBLIC_VAPID_PUBLIC_KEY et VAPID_PRIVATE_KEY' }
    }

    await createUserNotification({
      userId,
      data: {
        message: payload.message,
        type: (payload.type as 'GENERAL' | undefined) ?? 'GENERAL',
        scheduleId: payload.scheduleId,
        metadata: payload.metadata,
      },
    })

    const subscriptions = await getActivePushSubscriptionsByUserId(userId)
    if (subscriptions.length === 0) {
      return { success: false, error: 'Aucun appareil push actif pour cet utilisateur' }
    }

    const pushPayload = buildPushPayload({ message: payload.message, userId, type: payload.type })
    const results = await Promise.allSettled(
      subscriptions.map((sub) => sendToDevice(sub, pushPayload)),
    )

    // Nettoyage des abonnements révoqués (410 Gone) — fire-and-forget
    results
      .filter((r): r is PromiseFulfilledResult<SendDeviceResult> =>
        r.status === 'fulfilled' && r.value.shouldMarkExpired,
      )
      .forEach((r) => markSubscriptionExpired(r.value.endpoint).catch(() => {}))

    const { successful } = analyzeSendResults(results)
    return { success: successful > 0 }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

export async function sendNotificationToCurrentUser(payload: { message: string }): Promise<{ success: boolean; error?: string }> {
  const auth = await authAccess()
  if (!auth.data) return { success: false, error: auth.error }
  return sendPushNotificationToUserById(auth.data.user.id, payload)
}

// ─── Debug ────────────────────────────────────────────────────────────────────

export async function debugUserSubscriptions() {
  const auth = await authAccess()
  if (!auth.data) return { success: false, error: auth.error }
  const { user } = auth.data

  try {
    const subscriptions = await getPushSubscriptionsByUserId(user.id)
    return {
      success: true,
      vapidConfigured: isVapidConfigured(),
      subscriptions: subscriptions.map((sub) => ({
        id: sub.id,
        endpoint: sub.endpoint.substring(0, 80) + '…',
        userAgent: sub.userAgent,
        createdAt: sub.createdAt,
        expiresAt: sub.expiresAt,
      })),
    }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

export async function debugPushStats() {
  try {
    const stats = await getPushSubscriptionStats()
    return { success: true, stats, vapidConfigured: isVapidConfigured() }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

'use server'
import webpush from 'web-push'
import { getUserInfo } from '@/services/user/userInfo'
import { ERRORS } from '@/config'
import { upsertPushSubscription, unsubscribeDevice, unsubscribeAllDevices, markSubscriptionExpired } from './database/push.mutations'
import { getActivePushSubscriptionsByUserId, getPushSubscriptionsByUserId, getSubscriptionStats } from './database/push.queries'
import { createUserNotification } from './database/notification.mutations'
import { isVapidConfigured, buildPushPayload, sendToDevice } from './push'

export type SerializedPushSubscription = {
  endpoint: string
  keys: { p256dh: string; auth: string }
  expirationTime: number | null
}

export async function subscribeUser(
  subscription: SerializedPushSubscription,
  userAgent?: string,
): Promise<{ data: true } | { error: string }> {
  try {
    const user = await getUserInfo()
    if (!user?.id) return { error: ERRORS.AUTH.UNAUTHORIZED }
    await upsertPushSubscription({
      userId: user.id,
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
      userAgent,
    })
    return { data: true }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

export async function unsubscribeUser(): Promise<{ data: true } | { error: string }> {
  try {
    const user = await getUserInfo()
    if (!user?.id) return { error: ERRORS.AUTH.UNAUTHORIZED }
    await unsubscribeAllDevices(user.id)
    return { data: true }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

export async function unsubscribeUserDevice(endpoint: string): Promise<{ data: true } | { error: string }> {
  try {
    const user = await getUserInfo()
    if (!user?.id) return { error: ERRORS.AUTH.UNAUTHORIZED }
    await unsubscribeDevice({ userId: user.id, endpoint })
    return { data: true }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

export async function sendPushNotificationToUserById(
  userId: string,
  payload: { message: string; type?: string; metadata?: Record<string, unknown>; scheduleId?: string },
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!isVapidConfigured()) {
      return { success: false, error: 'VAPID non configuré — vérifier NEXT_PUBLIC_VAPID_PUBLIC_KEY et VAPID_PRIVATE_KEY' }
    }

    // Persister la notification en base
    await createUserNotification({
      userId,
      data: {
        message: payload.message,
        type: (payload.type as 'GENERAL' | undefined) ?? 'GENERAL',
        scheduleId: payload.scheduleId,
        metadata: payload.metadata,
      },
    })

    // Récupérer les abonnements push actifs
    const subscriptions = await getActivePushSubscriptionsByUserId(userId)
    if (subscriptions.length === 0) {
      return { success: false, error: 'Aucun appareil push actif pour cet utilisateur' }
    }

    const pushPayload = buildPushPayload({ message: payload.message, userId })

    const results = await Promise.allSettled(
      subscriptions.map(sub => sendToDevice(sub, pushPayload))
    )

    const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length
    return { success: successful > 0 }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

export async function sendNotificationToUser(payload: {
  message: string
}): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await getUserInfo()
    if (!user?.id) return { success: false, error: ERRORS.AUTH.UNAUTHORIZED }
    return sendPushNotificationToUserById(user.id, payload)
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

// Alias V1
export const debugUserSubscriptions = debugUserSubscriptionsAction

export async function debugUserSubscriptionsAction() {
  try {
    const user = await getUserInfo()
    if (!user?.id) return { success: false, error: ERRORS.AUTH.UNAUTHORIZED }
    const subscriptions = await getPushSubscriptionsByUserId(user.id)
    return {
      success: true,
      subscriptions: subscriptions.map(sub => ({
        id: sub.id,
        endpoint: sub.endpoint.substring(0, 100) + '...',
        userAgent: sub.userAgent,
        createdAt: sub.createdAt,
        expiresAt: sub.expiresAt,
      })),
      vapidConfigured: isVapidConfigured(),
    }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

export async function debugSubscriptionsAction() {
  try {
    const stats = await getSubscriptionStats()
    return { success: true, stats, vapidConfigured: isVapidConfigured() }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

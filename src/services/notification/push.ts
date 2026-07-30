import webpush from 'web-push'
import { markSubscriptionExpired } from './database/push.mutations'
import type { PushPayload } from './types'

export function isVapidConfigured(): boolean {
  return !!(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY)
}

function initVapid() {
  if (!isVapidConfigured()) return
  webpush.setVapidDetails(
    `mailto:${process.env.VAPID_EMAIL ?? 'admin@example.com'}`,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!,
  )
}

initVapid()

export function buildPushPayload(params: {
  message: string
  userId?: string
  title?: string
}): string {
  const payload: PushPayload = {
    title: params.title ?? 'Notification 🔔',
    body: params.message,
    icon: '/icon-192x192.png',
    badge: '/icon-192x192.png',
    tag: 'notification-' + Date.now(),
    timestamp: Date.now(),
    data: params.userId ? { userId: params.userId } : undefined,
  }
  return JSON.stringify(payload)
}

export async function sendToDevice(
  subscription: { endpoint: string; p256dh: string; auth: string },
  payload: string,
): Promise<{ success: boolean; endpoint: string; statusCode?: number; error?: string }> {
  try {
    const pushSub: webpush.PushSubscription = {
      endpoint: subscription.endpoint,
      keys: { p256dh: subscription.p256dh, auth: subscription.auth },
    }
    const result = await webpush.sendNotification(pushSub, payload)
    return { success: true, endpoint: subscription.endpoint, statusCode: result.statusCode }
  } catch (e: unknown) {
    const err = e as { statusCode?: number; message?: string }
    // Abonnement révoqué → marquer expiré (évite les envois futurs)
    if (err.statusCode === 410) {
      await markSubscriptionExpired(subscription.endpoint).catch(() => {})
    }
    return {
      success: false,
      endpoint: subscription.endpoint,
      statusCode: err.statusCode,
      error: err.message ?? 'Erreur inconnue',
    }
  }
}

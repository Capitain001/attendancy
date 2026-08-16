import 'server-only'
import webpush from 'web-push'
import { NOTIFICATION_CONFIG, NOTIFICATION_TITLES } from '@/config/notification'
import type { PushPayload, SendDeviceResult } from './types'

// ─── Configuration VAPID ──────────────────────────────────────────────────────

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

// ─── Construction du payload ──────────────────────────────────────────────────

export function buildPushPayload(params: {
  message: string
  userId?: string
  type?: string
  title?: string
}): string {
  const resolvedTitle =
    params.title ??
    (params.type && params.type in NOTIFICATION_TITLES
      ? NOTIFICATION_TITLES[params.type as keyof typeof NOTIFICATION_TITLES]
      : 'Notification 🔔')

  const payload: PushPayload = {
    title: resolvedTitle,
    body: params.message,
    icon: NOTIFICATION_CONFIG.defaultIcon,
    badge: NOTIFICATION_CONFIG.defaultIcon,
    tag: `notification-${Date.now()}`,
    timestamp: Date.now(),
    data: params.userId ? { userId: params.userId } : undefined,
  }
  return JSON.stringify(payload)
}

// ─── Envoi à un appareil ──────────────────────────────────────────────────────
// Pur : aucun side-effect DB. Si shouldMarkExpired=true, c'est le service qui
// appelle markSubscriptionExpired après coup.

export async function sendToDevice(
  subscription: { endpoint: string; p256dh: string; auth: string },
  payload: string,
): Promise<SendDeviceResult> {
  try {
    const pushSub: webpush.PushSubscription = {
      endpoint: subscription.endpoint,
      keys: { p256dh: subscription.p256dh, auth: subscription.auth },
    }
    const result = await webpush.sendNotification(pushSub, payload)
    return {
      success: true,
      endpoint: subscription.endpoint,
      statusCode: result.statusCode,
      shouldMarkExpired: false,
    }
  } catch (e: unknown) {
    const err = e as { statusCode?: number; message?: string }
    return {
      success: false,
      endpoint: subscription.endpoint,
      statusCode: err.statusCode,
      error: err.message ?? 'Erreur inconnue',
      shouldMarkExpired: err.statusCode === 410,
    }
  }
}

// ─── Analyse des résultats d'envoi ───────────────────────────────────────────

export function analyzeSendResults(results: PromiseSettledResult<SendDeviceResult>[]) {
  const successful = results.filter(
    (r): r is PromiseFulfilledResult<SendDeviceResult> =>
      r.status === 'fulfilled' && r.value.success,
  ).length
  return { successful, failed: results.length - successful, total: results.length }
}

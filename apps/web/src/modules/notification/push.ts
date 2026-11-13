// src/modules/notification/push.ts
import 'server-only'
import webpush from 'web-push'
import type { Resource, NotificationEvent } from '@/generated/prisma/browser'
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
  title: string
  body: string
  icon: string
  data: Record<string, unknown>
}): string {
  const payload: PushPayload = {
    title: params.title,
    body: params.body,
    icon: params.icon,
    badge: params.icon,
    tag: `notification-${Date.now()}`,
    timestamp: Date.now(),
    data: params.data,
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
    const result = await webpush.sendNotification(pushSub, payload, { urgency: 'high' })
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
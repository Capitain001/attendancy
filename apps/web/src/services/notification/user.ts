// src/services/notification/user.ts
'use server'
import * as v from 'valibot'
import { authAccess } from '@/services/auth'
import { ERRORS } from '@/config'
import { isVapidConfigured } from '@/modules/notification/server'
import { subscribeSchema } from '@/modules/notification'
import type { SerializedPushSubscription } from '@/modules/notification/types'
import {
  upsertPushSubscription,
  unsubscribeDevice,
  unsubscribeAllDevices,
} from './database/push.mutations'
import {
  getPushSubscriptionsByUserId,
  getPushSubscriptionStats,
} from './database/push.queries'
import { sendPushNotificationToUserById } from './push'

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

// ─── Envoi utilisateur connecté ──────────────────────────────────────────────

export async function sendNotificationToCurrentUser(payload: { message: string }) {
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


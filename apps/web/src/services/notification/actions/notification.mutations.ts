'use server'
import * as v from 'valibot'
import { authAccess } from '@/modules/auth'
import { ERRORS } from '@/config'
import { createNotificationSchema } from '../validation'
import {
  markNotificationRead,
  markAllNotificationsRead,
  removeNotification,
  createNotificationForOrgUser,
  checkOrgMembership,
} from '../database/notification.mutations'
import { sendPushNotificationToUserById } from '../user'

// ─── Utilisateur (actions scope personnel) ──────────────────────────────────

export async function markNotificationAsRead(notificationId: string) {
  // 1. Authentification (hors try/catch)
  const auth = await authAccess()
  if (!auth.data) return { error: auth.error }
  const { user } = auth.data

  // 2. Opération métier
  try {
    await markNotificationRead({ notificationId, userId: user.id })
    return { data: true as const }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

export async function markAllRead() {
  // 1. Authentification (hors try/catch)
  const auth = await authAccess()
  if (!auth.data) return { error: auth.error }
  const { user } = auth.data

  // 2. Opération métier
  try {
    await markAllNotificationsRead(user.id)
    return { data: true as const }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

export async function deleteNotification(notificationId: string) {
  // 1. Authentification (hors try/catch)
  const auth = await authAccess()
  if (!auth.data) return { error: auth.error }
  const { user } = auth.data

  // 2. Opération métier
  try {
    await removeNotification({ notificationId, userId: user.id })
    return { data: true as const }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

// ─── Admin (scope organisation) ──────────────────────────────────────────────

export async function createAdminNotification(
  userId: string,
  input: { message: string; type?: string; scheduleId?: string; metadata?: Record<string, unknown> },
) {
  // 1. Validation (hors try/catch)
  const parsed = v.safeParse(createNotificationSchema, input)
  if (!parsed.success) {
    return { error: parsed.issues[0]?.message ?? 'Données invalides' }
  }

  // 2. Authentification et autorisation (hors try/catch)
  const auth = await authAccess({ requiredRole: 'DIRECTION' })
  if (!auth.data) return { error: auth.error }
  const { orgId } = auth.data

  // 3. Opération métier
  try {
    return { data: await createNotificationForOrgUser({ orgId, userId, data: parsed.output }) }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

export async function sendAdminPushNotification(
  userId: string,
  input: { message: string; type?: string; scheduleId?: string; metadata?: Record<string, unknown> },
) {
  // 1. Validation (hors try/catch)
  const parsed = v.safeParse(createNotificationSchema, input)
  if (!parsed.success) {
    return { error: parsed.issues[0]?.message ?? 'Données invalides' }
  }

  // 2. Authentification et autorisation (hors try/catch)
  const auth = await authAccess({ requiredRole: 'DIRECTION' })
  if (!auth.data) return { error: auth.error }
  const { orgId } = auth.data

  // 3. Vérification d'appartenance à l'org (hors try/catch)
  const isMember = await checkOrgMembership(userId, orgId)
  if (!isMember) {
    return { error: "L'utilisateur n'appartient pas à cette organisation" }
  }

  // 4. Opération métier
  try {
    const result = await sendPushNotificationToUserById(userId, {
      message: parsed.output.message,
      type: parsed.output.type,
      scheduleId: parsed.output.scheduleId,
      metadata: parsed.output.metadata,
    })
    return result.success ? { data: true as const } : { error: result.error ?? ERRORS.SERVER }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

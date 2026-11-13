// src/services/notification/actions/notification.mutations.ts
'use server'
import * as v from 'valibot'
import { authAccess } from '@/modules/auth'
import { getUserInfo } from '@/modules/user'
import { ERRORS } from '@/config'
import {
  createAdminNotificationSchema,
  markNotificationAsReadSchema,
  type CreateAdminNotificationInput,
} from '../validation'
import {
  markNotificationRead,
  markAllNotificationsRead,
  removeNotification,
  createNotificationForOrgUser,
  checkOrgMembership,
} from '../database/notification.mutations'
import { sendPushNotificationToUserById } from '../push'

// ─── Boîte de réception (Inbox) ───────────────────────────────────────────────

export async function markInboxNotificationAsReadAction(input: { notificationId: string }) {
  const user = await getUserInfo()
  if (!user?.id) return { error: 'Non authentifié' }

  const parsed = v.safeParse(markNotificationAsReadSchema, input)
  if (!parsed.success) {
    return { error: parsed.issues[0]?.message ?? 'ID invalide' }
  }

  try {
    await markNotificationRead({ notificationId: parsed.output.notificationId, userId: user.id })
    return { data: true as const }
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Erreur serveur' }
  }
}

export async function markAllInboxNotificationsAsReadAction() {
  const user = await getUserInfo()
  if (!user?.id) return { error: 'Non authentifié' }

  try {
    await markAllNotificationsRead(user.id)
    return { data: true as const }
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Erreur serveur' }
  }
}

// ─── Utilisateur (actions scope personnel) ──────────────────────────────────

export async function markNotificationAsRead(notificationId: string) {
  const user = await getUserInfo()
  if (!user?.id) return { error: 'Non authentifié' }

  try {
    await markNotificationRead({ notificationId, userId: user.id })
    return { data: true as const }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

export async function markAllRead() {
  const user = await getUserInfo()
  if (!user?.id) return { error: 'Non authentifié' }

  try {
    await markAllNotificationsRead(user.id)
    return { data: true as const }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

export async function deleteNotification(notificationId: string) {
  const user = await getUserInfo()
  if (!user?.id) return { error: 'Non authentifié' }

  try {
    await removeNotification({ notificationId, userId: user.id })
    return { data: true as const }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

// ─── Direction / Admin (scope organisation) ──────────────────────────────────

export async function createNotificationAction(
  userId: string,
  input: CreateAdminNotificationInput,
) {
  const auth = await authAccess({ requiredRole: 'DIRECTION' })
  if (!auth.data) return { error: auth.error }
  const { orgId } = auth.data

  const parsed = v.safeParse(createAdminNotificationSchema, input)
  if (!parsed.success) {
    return { error: parsed.issues[0]?.message ?? 'Données invalides' }
  }

  try {
    return { data: await createNotificationForOrgUser({ orgId, userId, data: parsed.output }) }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

export async function sendAdminPushNotification(
  userId: string,
  input: CreateAdminNotificationInput,
) {
  const auth = await authAccess({ requiredRole: 'DIRECTION' })
  if (!auth.data) return { error: auth.error }
  const { orgId } = auth.data

  const parsed = v.safeParse(createAdminNotificationSchema, input)
  if (!parsed.success) {
    return { error: parsed.issues[0]?.message ?? 'Données invalides' }
  }

  const isMember = await checkOrgMembership(userId, orgId)
  if (!isMember) {
    return { error: "L'utilisateur n'appartient pas à cette organisation" }
  }

  try {
    const result = await sendPushNotificationToUserById(userId, {
      ...parsed.output,
      orgId,
    })
    return result.success ? { data: true as const } : { error: result.error ?? ERRORS.SERVER }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

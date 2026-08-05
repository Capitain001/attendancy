'use server'
import { authAccess } from '@/services/auth'
import { ERRORS } from '@/config'
import {
  getNotificationsForUser,
  getUnreadNotificationsForUser,
  getUnreadCountForUser,
  getOrganizationNotifications,
  getOrganizationUnreadNotifications,
  getOrganizationUserNotifications,
  getOrganizationUnreadCount,
  getOrganizationNotificationStats,
} from '../database/notification.queries'

// ─── Utilisateur ──────────────────────────────────────────────────────────────

export async function getNotifications(limit?: number) {
  const auth = await authAccess()
  if (!auth.data) return { error: auth.error }
  const { user } = auth.data

  try {
    return { data: await getNotificationsForUser(user.id, limit) }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

export async function getUnread(limit?: number) {
  const auth = await authAccess()
  if (!auth.data) return { error: auth.error }
  const { user } = auth.data

  try {
    return { data: await getUnreadNotificationsForUser(user.id, limit) }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

export async function getUnreadCount() {
  const auth = await authAccess()
  if (!auth.data) return { error: auth.error }
  const { user } = auth.data

  try {
    return { data: await getUnreadCountForUser(user.id) }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

// ─── Admin (scope organisation) ───────────────────────────────────────────────

export async function getAdminNotifications(limit?: number) {
  const auth = await authAccess({ requiredRole: 'DIRECTION' })
  if (!auth.data) return { error: auth.error }
  const { orgId } = auth.data

  try {
    return { data: await getOrganizationNotifications(orgId, limit) }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

export async function getAdminUnreadNotifications(limit?: number) {
  const auth = await authAccess({ requiredRole: 'DIRECTION' })
  if (!auth.data) return { error: auth.error }
  const { orgId } = auth.data

  try {
    return { data: await getOrganizationUnreadNotifications(orgId, limit) }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

export async function getAdminUserNotifications(userId: string, limit?: number) {
  const auth = await authAccess({ requiredRole: 'DIRECTION' })
  if (!auth.data) return { error: auth.error }
  const { orgId } = auth.data

  try {
    return { data: await getOrganizationUserNotifications(orgId, userId, limit) }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

export async function getAdminUnreadCount() {
  const auth = await authAccess({ requiredRole: 'DIRECTION' })
  if (!auth.data) return { error: auth.error }
  const { orgId } = auth.data

  try {
    return { data: await getOrganizationUnreadCount(orgId) }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

export async function getAdminNotificationStats() {
  const auth = await authAccess({ requiredRole: 'DIRECTION' })
  if (!auth.data) return { error: auth.error }
  const { orgId } = auth.data

  try {
    return { data: await getOrganizationNotificationStats(orgId) }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

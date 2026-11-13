// src/services/notification/actions/notification.queries.ts
'use server'
import * as v from 'valibot'
import { authAccess } from '@/services/auth'
import { getUserInfo } from '@/modules/user'
import { getOrgsIdentities } from '@/services/organization/server'
import { ERRORS } from '@/config'
import {
  getInboxNotificationsSchema,
  type GetInboxNotificationsInput,
} from '../validation'
import {
  getNotificationsForUser,
  getUnreadNotificationsForUser,
  getUnreadCountForUser,
  getInboxNotificationsForUser,
  getOrganizationNotifications,
  getOrganizationUnreadNotifications,
  getOrganizationUserNotifications,
  getOrganizationUnreadCount,
  getOrganizationNotificationStats,
} from '../database/notification.queries'

// ─── Boîte de réception (Inbox) ───────────────────────────────────────────────

export async function getInboxNotificationsAction(input?: GetInboxNotificationsInput) {
  const user = await getUserInfo()
  if (!user?.id) return { error: 'Non authentifié' }

  const parsed = v.safeParse(getInboxNotificationsSchema, input ?? {})
  if (!parsed.success) {
    return { error: parsed.issues[0]?.message ?? 'Paramètres invalides' }
  }

  try {
    const notifications = await getInboxNotificationsForUser(
      user.id,
      parsed.output.filter,
      parsed.output.limit,
      parsed.output.cursor,
    )

    const nextCursor = notifications.length === parsed.output.limit
      ? notifications[notifications.length - 1]?.id
      : undefined

    // Extraction directe des orgIds des invitations via la colonne orgId
    const orgIds = Array.from(
      new Set(
        notifications
          .filter((n) => n.resourceType === 'INVITATION' && typeof n.orgId === 'string')
          .map((n) => n.orgId as string),
      ),
    )

    if (orgIds.length === 0) {
      return {
        data: {
          items: notifications,
          nextCursor,
        },
      }
    }

    const orgs = await getOrgsIdentities(orgIds)
    const orgMap = new Map(orgs.map((o) => [o.id, o]))

    const enriched = notifications.map((n) => {
      if (n.resourceType === 'INVITATION' && n.orgId) {
        const org = orgMap.get(n.orgId)
        if (org) {
          return {
            ...n,
            metadata: {
              ...(typeof n.metadata === 'object' && n.metadata !== null ? n.metadata : {}),
              orgLogo: org.logo ?? null,
              orgName: org.name,
              orgSlug: org.slug,
              orgType: org.type,
            },
          }
        }
      }
      return n
    })

    return {
      data: {
        items: enriched,
        nextCursor,
      },
    }
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Erreur lors du chargement des notifications' }
  }
}

export async function getInboxUnreadCountAction() {
  const user = await getUserInfo()
  if (!user?.id) return { error: 'Non authentifié' }

  try {
    const count = await getUnreadCountForUser(user.id)
    return { data: count }
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Erreur serveur' }
  }
}


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

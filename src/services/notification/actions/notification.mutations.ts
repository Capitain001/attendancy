'use server'
import * as v from 'valibot'
import { getUserInfo } from '@/services/user/userInfo'
import { getAuthorization } from '@/services/auth/authorization'
import { ERRORS } from '@/config'
import { createNotificationSchema } from '../validation'
import {
  markNotificationRead,
  markAllNotificationsRead,
  removeNotification,
  createNotificationForOrgUser,
} from '../database/notification.mutations'
import { sendPushNotificationToUserById } from '../user'

export async function markNotificationAsRead(notificationId: string) {
  try {
    const user = await getUserInfo()
    if (!user?.id) return { error: ERRORS.AUTH.UNAUTHORIZED }
    await markNotificationRead({ notificationId, userId: user.id })
    return { data: true as const }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

export async function markAllRead() {
  try {
    const user = await getUserInfo()
    if (!user?.id) return { error: ERRORS.AUTH.UNAUTHORIZED }
    await markAllNotificationsRead(user.id)
    return { data: true as const }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

export async function deleteNotification(notificationId: string) {
  try {
    const user = await getUserInfo()
    if (!user?.id) return { error: ERRORS.AUTH.UNAUTHORIZED }
    await removeNotification({ notificationId, userId: user.id })
    return { data: true as const }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

export async function createAdminNotification(
  userId: string,
  input: { message: string; type?: string; scheduleId?: string; metadata?: Record<string, unknown> },
) {
  try {
    const user = await getUserInfo()
    if (!user?.id) return { error: ERRORS.AUTH.UNAUTHORIZED }
    const orgId = user.organization?.id
    if (!orgId) return { error: ERRORS.ORG.NOT_FOUND }
    const auth = getAuthorization(user, 'DIRECTION')
    if (!auth.success) return { error: auth.error }
    const parsed = v.parse(createNotificationSchema, input)
    return { data: await createNotificationForOrgUser({ orgId, userId, data: parsed }) }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

export async function sendAdminPushNotification(
  userId: string,
  input: { message: string; type?: string; scheduleId?: string; metadata?: Record<string, unknown> },
) {
  try {
    const user = await getUserInfo()
    if (!user?.id) return { error: ERRORS.AUTH.UNAUTHORIZED }
    const orgId = user.organization?.id
    if (!orgId) return { error: ERRORS.ORG.NOT_FOUND }
    const auth = getAuthorization(user, 'DIRECTION')
    if (!auth.success) return { error: auth.error }
    const { prisma } = await import('@/lib/prisma')
    const membership = await prisma.userOrganization.findFirst({
      where: { userId, orgId },
      select: { id: true },
    })
    if (!membership) return { error: "L'utilisateur n'appartient pas à cette organisation" }
    const parsed = v.parse(createNotificationSchema, input)
    return { data: await sendPushNotificationToUserById(userId, { message: parsed.message }) }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

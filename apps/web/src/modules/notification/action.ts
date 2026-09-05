//src/services/notification/action.ts

'use server'

import { ERRORS } from '@/config'
import { getAuthUser } from '../auth/persmission/acces'
import { 
  createUserNotification,
  getUnreadNotifications,
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  deleteUserNotification,
  getUnreadCount,
  getOrganizationNotifications,
  getOrganizationUnreadNotifications,
  getOrganizationUserNotifications,
  getOrganizationUnreadCount,
  getOrganizationNotificationStats,
  createOrganizationNotification,
  type CreateNotificationData
} from './database'
import { sendPushNotificationToUserById } from './user'
import { NotificationType } from '@/generated/prisma/client'

export async function isVapidConfigured(): Promise<boolean> {
  return !!(
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY &&
    process.env.VAPID_PRIVATE_KEY
  );
}

// Actions qui gèrent l'authentification
export async function createNotification(data: CreateNotificationData) {
  const user = await getAuthUser()
  return await createUserNotification({ data, userId: user.id! })
}

export async function getUnread() {
  const user = await getAuthUser()
  return await getUnreadNotifications(user.id!)
}

export async function getNotifications(limit?: number) {
  const user = await getAuthUser()
  return await getUserNotifications(user.id!, limit)
}

export async function markNotificationAsRead(notificationId: string) {
  const user = await getAuthUser()
  return await markAsRead({ notificationId, userId: user.id! })
}

export async function markAllRead() {
  const user = await getAuthUser()
  return await markAllAsRead(user.id!)
}

export async function deleteNotification(notificationId: string) {
  const user = await getAuthUser()
  return await deleteUserNotification({ notificationId, userId: user.id! })
}

// export async function getUnreadCount() {
//   const user = await getAuthUser()
//   return await getUnreadCount({userId: user.id})
// }

// ==================== ACTIONS ADMIN ====================

// Récupérer toutes les notifications de l'organisation
export async function getAdminNotifications(limit?: number) {
  const user = await getAuthUser()
  const organizationId = user.organization?.id
  
  if (!organizationId) {
    return { error: ERRORS.ORG.NOT_FOUND }
  }

  return await getOrganizationNotifications(organizationId, limit)
}

// Récupérer les notifications non lues de l'organisation
export async function getAdminUnreadNotifications(limit?: number) {
  const user = await getAuthUser()
  const organizationId = user.organization?.id
  
  if (!organizationId) {
    return { error: ERRORS.ORG.NOT_FOUND }
  }

  return await getOrganizationUnreadNotifications(organizationId, limit)
}

// Récupérer les notifications d'un utilisateur spécifique
export async function getAdminUserNotifications(userId: string, limit?: number) {
  const user = await getAuthUser()
  const organizationId = user.organization?.id
  
  if (!organizationId) {
    return { error: ERRORS.ORG.NOT_FOUND }
  }

  return await getOrganizationUserNotifications(organizationId, userId, limit)
}

// Compter les notifications non lues de l'organisation
export async function getAdminUnreadCount() {
  const user = await getAuthUser()
  const organizationId = user.organization?.id
  
  if (!organizationId) {
    return { error: ERRORS.ORG.NOT_FOUND }
  }

  return await getOrganizationUnreadCount(organizationId)
}

// Obtenir les statistiques des notifications de l'organisation
export async function getAdminNotificationStats() {
  const user = await getAuthUser()
  const organizationId = user.organization?.id
  
  if (!organizationId) {
    return { error: ERRORS.ORG.NOT_FOUND }
  }

  return await getOrganizationNotificationStats(organizationId)
}

// Créer une notification pour un utilisateur de l'organisation
export async function createAdminNotification(userId: string, data: CreateNotificationData) {
  const user = await getAuthUser()
  const organizationId = user.organization?.id
  
  if (!organizationId) {
    return { error: ERRORS.ORG.NOT_FOUND }
  }

  return await createOrganizationNotification({ organizationId, userId, data })
}

/**
 * Envoie une notification push web à un utilisateur spécifique via son ID
 * 
 * Cette fonction crée une notification dans la base de données et envoie une 
 * notification push à tous les appareils de l'utilisateur.
 * 
 * @param userId - L'ID de l'utilisateur destinataire
 * @param data - Les données de la notification
 * @returns Résultat de l'envoi avec statistiques
 * 
 * @example
 * ```typescript
 * const result = await sendPushNotificationById('user-id-123', {
 *   message: 'Vous avez un nouveau message',
 *   type: NotificationType.MESSAGE,
 *   metadata: { chatId: 'chat-456' }
 * })
 * 
 * if (result.success) {
 *   console.log(`Notification envoyée à ${result.sent} appareil(s)`)
 * }
 * ```
 */
export async function sendPushNotificationById(
  userId: string,
  data: {
    message: string
    type?: NotificationType
    metadata?: any
    scheduleId?: string
  }
) {
  return await sendPushNotificationToUserById(userId, data)
}

/**
 * Envoie une notification push web à un utilisateur de l'organisation (admin)
 * 
 * Vérifie que l'utilisateur appartient à l'organisation de l'admin avant d'envoyer.
 * 
 * @param userId - L'ID de l'utilisateur destinataire
 * @param data - Les données de la notification
 * @returns Résultat de l'envoi avec statistiques
 */
export async function sendAdminPushNotification(
  userId: string,
  data: {
    message: string
    type?: NotificationType
    metadata?: any
    scheduleId?: string
  }
) {
  const user = await getAuthUser()
  const organizationId = user.organization?.id
  
  if (!organizationId) {
    return { success: false, error: ERRORS.ORG.NOT_FOUND }
  }

  // Vérifier que l'utilisateur appartient à l'organisation
  const { prisma } = await import('@/lib/prisma')
  const userOrg = await prisma.userOrganization.findFirst({
    where: {
      userId,
      orgId: organizationId
    }
  })

  if (!userOrg) {
    return { 
      success: false, 
      error: "L'utilisateur n'appartient pas à cette organisation" 
    }
  }

  return await sendPushNotificationToUserById(userId, data)
}

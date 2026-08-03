// src/services/notification/database.ts
'use server'

import { prisma } from '@/lib/prisma'
import { tryCatch } from '@/utils/server'
import { Notification, NotificationType } from '@/generated/prisma/client'

export type CreateNotificationData = Pick<Notification, 'message' | 'type' > & {
  metadata?: any
  scheduleId?: string
}


// CRUD des notifications
export async function createUserNotification({data, userId}: {data: CreateNotificationData, userId: string}) {
  return tryCatch(
    prisma.notification.create({
      data: {
        userId: userId,
        message: data.message,
        type: data.type || NotificationType.GENERAL,
        metadata: data.metadata || {},
        scheduleId: data.scheduleId
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    })
  )
}

// Récupérer les notifications non lues d'un utilisateur
export async function getUnreadNotifications(userId: string) {
  return tryCatch(
    prisma.notification.findMany({
      where: {
        userId,
        read: false,
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10
    })
  )
}

// Récupérer toutes les notifications d'un utilisateur
export async function getUserNotifications(userId: string, limit: number = 20) {
  return tryCatch(
    prisma.notification.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit
    })
  )
}

// Marquer une notification comme lue
export async function markAsRead({notificationId, userId}: {notificationId: string, userId: string}) {
  return tryCatch(
    prisma.notification.updateMany({
      where: {
        id: notificationId,
        userId
      },
      data: {
        read: true
      }
    })
  )
}

// Marquer toutes les notifications comme lues
export async function markAllAsRead(userId: string) {
  return tryCatch(
    prisma.notification.updateMany({
      where: {
        userId,
        read: false,
      },
      data: {
        read: true
      }
    })
  )
}

// Supprimer une notification (hard delete — pas de deletedAt dans le modèle)
export async function deleteUserNotification({notificationId, userId}: {notificationId: string, userId: string}) {
  return tryCatch(
    prisma.notification.deleteMany({
      where: {
        id: notificationId,
        userId
      }
    })
  )
}

// Compter les notifications non lues
export async function getUnreadCount({userId}: {userId: string}) {
  return tryCatch(
    prisma.notification.count({
      where: {
        userId,
        read: false,
      }
    })
  )
}

// ==================== FONCTIONS ADMIN ====================

// Récupérer toutes les notifications des utilisateurs d'une organisation
export async function getOrganizationNotifications(organizationId: string, limit: number = 50) {
  return tryCatch(
    prisma.notification.findMany({
      where: {
        user: {
          userOrganizations: {
            some: {
              orgId: organizationId
            }
          }
        },
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar_url: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit
    })
  )
}

// Récupérer les notifications non lues d'une organisation
export async function getOrganizationUnreadNotifications(organizationId: string, limit: number = 50) {
  return tryCatch(
    prisma.notification.findMany({
      where: {
        user: {
          userOrganizations: {
            some: {
              orgId: organizationId
            }
          }
        },
        read: false,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar_url: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit
    })
  )
}

// Récupérer les notifications d'un utilisateur spécifique dans l'organisation
export async function getOrganizationUserNotifications(organizationId: string, userId: string, limit: number = 20) {
  return tryCatch(
    prisma.notification.findMany({
      where: {
        userId,
        user: {
          userOrganizations: {
            some: {
              orgId: organizationId
            }
          }
        },
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar_url: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit
    })
  )
}

// Compter les notifications non lues d'une organisation
export async function getOrganizationUnreadCount(organizationId: string) {
  return tryCatch(
    prisma.notification.count({
      where: {
        user: {
          userOrganizations: {
            some: {
              orgId: organizationId
            }
          }
        },
        read: false,
      }
    })
  )
}

// Obtenir les statistiques des notifications d'une organisation
export async function getOrganizationNotificationStats(organizationId: string) {
  return tryCatch(
    (async () => {
      const orgWhere = {
        user: {
          userOrganizations: {
            some: {
              orgId: organizationId
            }
          }
        },
      }

      const total = await prisma.notification.count({ where: orgWhere })

      const unread = await prisma.notification.count({
        where: { ...orgWhere, read: false }
      })

      const byType = await prisma.notification.groupBy({
        by: ['type'],
        where: orgWhere,
        _count: {
          type: true
        }
      })

      const uniqueUsers = await prisma.notification.groupBy({
        by: ['userId'],
        where: orgWhere,
      })

      return {
        total,
        unread,
        read: total - unread,
        byType: byType.reduce<Partial<Record<NotificationType, number>>>((acc, item) => {
          const typedItem = item as { type: NotificationType; _count: { type: number } }
          acc[typedItem.type] = typedItem._count.type
          return acc
        }, {}),
        uniqueUsers: uniqueUsers.length
      }
    })()
  )
}

// Créer une notification pour un utilisateur de l'organisation (admin)
export async function createOrganizationNotification({
  organizationId,
  userId,
  data
}: {
  organizationId: string
  userId: string
  data: CreateNotificationData
}) {
  const userOrg = await prisma.userOrganization.findFirst({
    where: {
      userId,
      orgId: organizationId
    }
  })

  if (!userOrg) {
    return {
      error: "L'utilisateur n'appartient pas à cette organisation"
    }
  }

  return tryCatch(
    prisma.notification.create({
      data: {
        userId: userId,
        message: data.message,
        type: data.type || NotificationType.GENERAL,
        metadata: data.metadata || {},
        scheduleId: data.scheduleId
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar_url: true
          }
        }
      }
    })
  )
}

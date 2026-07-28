// src/hooks/notification/useAdminNotifications.ts
"use client"

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  getAdminNotifications, 
  getAdminUnreadNotifications,
  getAdminUnreadCount,
  getAdminNotificationStats,
  getAdminUserNotifications,
  createAdminNotification
} from '@/services/notification/action'
import { CACHE_KEYS } from '@/config/client_cache'
import { CreateNotificationData } from '@/services/notification/database'

export function useAdminNotifications(limit?: number) {
  const queryClient = useQueryClient()

  // Récupérer toutes les notifications de l'organisation
  const {
    data: notifications,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: [...CACHE_KEYS.NOTIFICATIONS.ALL, 'admin', limit],
    queryFn: async () => {
      const result = await getAdminNotifications(limit)
      if ('error' in result) throw new Error(result.error)
      return result.data
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  })

  // Dériver les notifications non lues
  const unread = notifications?.filter(n => !n.read) || []

  // Statistiques
  const { data: stats } = useQuery({
    queryKey: [...CACHE_KEYS.NOTIFICATIONS.ALL, 'admin', 'stats'],
    queryFn: async () => {
      const result = await getAdminNotificationStats()
      if ('error' in result) throw new Error(result.error)
      return result.data
    },
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  })

  // Mutation pour créer une notification
  const createNotificationMutation = useMutation({
    mutationFn: ({ userId, data }: { userId: string; data: CreateNotificationData }) =>
      createAdminNotification(userId, data),
    onSuccess: () => {
      // Invalider le cache pour recharger les notifications
      queryClient.invalidateQueries({ queryKey: [...CACHE_KEYS.NOTIFICATIONS.ALL, 'admin'] })
    },
  })

  return {
    notifications: notifications || [],
    unread,
    stats: stats || null,
    isLoading,
    error,
    actions: {
      refresh: refetch,
      createNotification: createNotificationMutation.mutateAsync,
      isCreating: createNotificationMutation.isPending,
    }
  }
}

// Hook pour récupérer les notifications d'un utilisateur spécifique
export function useAdminUserNotifications(userId: string, limit?: number) {
  const queryClient = useQueryClient()

  const {
    data: notifications,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: [...CACHE_KEYS.NOTIFICATIONS.ALL, 'admin', 'user', userId, limit],
    queryFn: async () => {
      const result = await getAdminUserNotifications(userId, limit)
      if ('error' in result) throw new Error(result.error)
      return result.data
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  })

  return {
    notifications: notifications || [],
    isLoading,
    error,
    actions: {
      refresh: refetch,
    }
  }
}


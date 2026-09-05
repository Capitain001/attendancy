// src/hooks/notification/useNotifications.ts
"use client"

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  getNotifications, 
  markAllRead, 
  markNotificationAsRead 
} from '@/modules/notification/action'
import { CACHE_KEYS } from '@/config/client_cache'

export function useNotifications() {
  const queryClient = useQueryClient()

  // Une seule requête pour toutes les notifications
  const {
    data: notifications,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: CACHE_KEYS.NOTIFICATIONS.ALL,
    queryFn: async () => {
      const result = await getNotifications()
      if ('error' in result) throw new Error(result.error)
      return result.data
    },
    
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    enabled: true,
  })

  // Dériver les notifications non lues
  const unread = notifications?.filter(n => !n.read) || []

  // Mutation pour marquer une notification comme lue
  const markAsReadMutation = useMutation({
    mutationFn: markNotificationAsRead,
    onSuccess: (_, notificationId) => {
      // Optimistic update: modifier le cache
      queryClient.setQueryData(CACHE_KEYS.NOTIFICATIONS.ALL, (old: any) =>
        old?.map((n: any) => 
          n.id === notificationId ? { ...n, read: true } : n
        )
      )
    },
  })

  // Mutation pour tout marquer comme lu
  const markAllReadMutation = useMutation({
    mutationFn: markAllRead,
    onSuccess: () => {
      // Optimistic update: marquer toutes comme lues
      queryClient.setQueryData(CACHE_KEYS.NOTIFICATIONS.ALL, (old: any) =>
        old?.map((n: any) => ({ ...n, read: true }))
      )
    },
  })

  return {
    notifications: notifications || [],
    unread,
    isLoading,
    error,
    actions: {
      refresh: refetch,
      markAsRead: markAsReadMutation.mutateAsync,
      markAllRead: markAllReadMutation.mutateAsync,
      isMarkingAsRead: markAsReadMutation.isPending,
      isMarkingAllRead: markAllReadMutation.isPending,
    }
  }
}

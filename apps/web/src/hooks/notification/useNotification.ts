// src/hooks/notification/useNotifications.ts
"use client"

import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { NotificationType } from '@/generated/prisma/browser'
import { 
  getNotifications, 
  markAllRead, 
  markNotificationAsRead 
} from '@/modules/notification/action'
import { CACHE_KEYS } from '@/config/client_cache'

interface UseNotificationsOptions {
  type?: NotificationType
  limit?: number
}

export function useNotifications({ type, limit = 20 }: UseNotificationsOptions = {}) {
  const queryClient = useQueryClient()

  const {
    data,
    isLoading,
    error,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = useInfiniteQuery({
    queryKey: [...CACHE_KEYS.NOTIFICATIONS.ALL, { type, limit }],
    queryFn: async ({ pageParam = 1 }) => {
      const result = await getNotifications(limit)
      if ('error' in result) throw new Error(result.error)
      return result.data
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage || lastPage.length < limit) return undefined
      return allPages.length + 1
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  })

  // Aplatir l'ensemble des pages chargées
  const allNotifications = data?.pages.flat() || []

  // Filtrer uniquement si un type d'enum valide est transmis
  const filteredNotifications = type 
    ? allNotifications.filter(n => n.type === type)
    : allNotifications

  const unread = filteredNotifications.filter(n => !n.read)

  // Mutations avec invalidation de cache
  const markAsReadMutation = useMutation({
    mutationFn: markNotificationAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CACHE_KEYS.NOTIFICATIONS.ALL })
    },
  })

  const markAllReadMutation = useMutation({
    mutationFn: markAllRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CACHE_KEYS.NOTIFICATIONS.ALL })
    },
  })

  return {
    notifications: filteredNotifications,
    unread,
    isLoading,
    error,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    actions: {
      refresh: refetch,
      markAsRead: markAsReadMutation.mutateAsync,
      markAllRead: markAllReadMutation.mutateAsync,
      isMarkingAsRead: markAsReadMutation.isPending,
      isMarkingAllRead: markAllReadMutation.isPending,
    }
  }
}
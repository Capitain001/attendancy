// src/hooks/notification/useNotification.ts
// src/hooks/notification/useNotifications.ts
"use client"

import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { Resource } from '@/generated/prisma/browser'
import { 
  getNotifications, 
  markAllRead, 
  markNotificationAsRead 
} from '@/services/notification/actions'
import { CACHE_KEYS } from '@/config/client_cache'

interface UseNotificationsOptions {
  resourceType?: Resource
  limit?: number
}

export function useNotifications({ resourceType, limit = 20 }: UseNotificationsOptions = {}) {
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
    queryKey: [...CACHE_KEYS.NOTIFICATIONS.ALL, { resourceType, limit }],
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
  const filteredNotifications = resourceType 
    ? allNotifications.filter(n => n.resourceType === resourceType)
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
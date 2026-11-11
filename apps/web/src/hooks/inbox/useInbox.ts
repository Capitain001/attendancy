// src/hooks/inbox/useInbox.ts
'use client'

import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getInboxNotificationsAction,
  getInboxUnreadCountAction,
} from '@/services/notification/actions/notification.queries'
import {
  markInboxNotificationAsReadAction,
  markAllInboxNotificationsAsReadAction,
} from '@/services/notification/actions/notification.mutations'
import {
  acceptInboxInvitationAction,
  declineInboxInvitationAction,
} from '@/modules/auth/members/inbox-invitation'
import type { InboxFilter } from '@/services/notification/validation'
import { CACHE_KEYS } from '@/config/client_cache'

export const INBOX_KEYS = {
  ...CACHE_KEYS.INBOX,
  USER_ORGS: ['user', 'organizations'] as const,
}

export function useInboxNotifications(filter: InboxFilter = 'all', limit = 20) {
  return useInfiniteQuery({
    queryKey: INBOX_KEYS.FILTER(filter),
    queryFn: async ({ pageParam }) => {
      const res = await getInboxNotificationsAction({
        filter,
        limit,
        cursor: pageParam as string | undefined,
      })
      if ('error' in res) throw new Error(res.error)
      return res.data
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage?.nextCursor ?? undefined,
    staleTime: 30 * 1000,
    refetchOnWindowFocus: true,
    refetchInterval: 30 * 1000,
  })
}

export function useInboxUnreadCount() {
  return useQuery({
    queryKey: INBOX_KEYS.UNREAD_COUNT,
    queryFn: async () => {
      const res = await getInboxUnreadCountAction()
      if ('error' in res) throw new Error(res.error)
      return res.data
    },
    staleTime: 30 * 1000,
    refetchOnWindowFocus: true,
    refetchInterval: 30 * 1000,
  })
}

export function useMarkInboxAsRead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (notificationId: string) => {
      const res = await markInboxNotificationAsReadAction({ notificationId })
      if ('error' in res) throw new Error(res.error)
      return res.data
    },
    onMutate: async (notificationId) => {
      await queryClient.cancelQueries({ queryKey: INBOX_KEYS.ALL })
      queryClient.setQueriesData({ queryKey: INBOX_KEYS.ALL }, (old: unknown) => {
        if (!old || typeof old !== 'object' || !('pages' in old)) return old
        const infData = old as { pages: { items: { id: string; read: boolean }[]; nextCursor?: string }[] }
        return {
          ...infData,
          pages: infData.pages.map((page) => ({
            ...page,
            items: page.items.map((item) => (item.id === notificationId ? { ...item, read: true } : item)),
          })),
        }
      })
      queryClient.setQueryData(INBOX_KEYS.UNREAD_COUNT, (old: number | undefined) => Math.max(0, (old ?? 1) - 1))
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: INBOX_KEYS.ALL })
      queryClient.invalidateQueries({ queryKey: INBOX_KEYS.UNREAD_COUNT })
    },
  })
}

export function useMarkAllInboxAsRead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      const res = await markAllInboxNotificationsAsReadAction()
      if ('error' in res) throw new Error(res.error)
      return res.data
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: INBOX_KEYS.ALL })
      queryClient.setQueriesData({ queryKey: INBOX_KEYS.ALL }, (old: unknown) => {
        if (!old || typeof old !== 'object' || !('pages' in old)) return old
        const infData = old as { pages: { items: { id: string; read: boolean }[]; nextCursor?: string }[] }
        return {
          ...infData,
          pages: infData.pages.map((page) => ({
            ...page,
            items: page.items.map((item) => ({ ...item, read: true })),
          })),
        }
      })
      queryClient.setQueryData(INBOX_KEYS.UNREAD_COUNT, 0)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: INBOX_KEYS.ALL })
      queryClient.invalidateQueries({ queryKey: INBOX_KEYS.UNREAD_COUNT })
    },
  })
}

export function useAcceptInvitation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (invitationId: string) => {
      const res = await acceptInboxInvitationAction({ invitationId })
      if ('error' in res) throw new Error(res.error)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: INBOX_KEYS.ALL })
      queryClient.invalidateQueries({ queryKey: INBOX_KEYS.UNREAD_COUNT })
      queryClient.invalidateQueries({ queryKey: INBOX_KEYS.USER_ORGS })
    },
  })
}

export function useDeclineInvitation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (invitationId: string) => {
      const res = await declineInboxInvitationAction({ invitationId })
      if ('error' in res) throw new Error(res.error)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: INBOX_KEYS.ALL })
      queryClient.invalidateQueries({ queryKey: INBOX_KEYS.UNREAD_COUNT })
    },
  })
}

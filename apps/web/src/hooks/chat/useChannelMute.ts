// src/hooks/chat/useChannelMute.ts
'use client'

import { useCallback } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { getChannelMuteByUserAction, updateChannelMuteByUserAction } from '@/services/channel-member/actions'

const muteKey = (channelId: string) => ['channel-mute', channelId] as const

export function useChannelMute(channelId: string) {
  const queryClient = useQueryClient()

  const { data: isMuted = false, isLoading } = useQuery({
    queryKey: muteKey(channelId),
    queryFn: async () => {
      const res = await getChannelMuteByUserAction({ channelId })
      if (!('data' in res) || !res.data) {
        throw new Error(('error' in res && res.error) || 'Impossible de lire la sourdine')
      }
      return res.data.muted
    },
    staleTime: 60_000, // un changement fait sur un autre appareil arrive au refetch (focus inclus)
  })

  const { mutate } = useMutation({
    mutationFn: async (muted: boolean) => {
      const res = await updateChannelMuteByUserAction({ channelId, data: { muted } })
      if (!('data' in res) || !res.data) {
        throw new Error(('error' in res && res.error) || 'Impossible de modifier la sourdine')
      }
      return res.data.muted
    },
    // Mise à jour optimiste, avec retour en arrière si le serveur refuse
    onMutate: async (muted) => {
      await queryClient.cancelQueries({ queryKey: muteKey(channelId) })
      const previous = queryClient.getQueryData<boolean>(muteKey(channelId))
      queryClient.setQueryData(muteKey(channelId), muted)
      return { previous }
    },
    onError: (error, _muted, context) => {
      queryClient.setQueryData(muteKey(channelId), context?.previous ?? false)
      toast.error(error.message)
    },
  })

  const toggleMute = useCallback(() => {
    if (isLoading) return // état inconnu : une bascule pourrait appliquer le mauvais sens
    mutate(!isMuted)
  }, [isLoading, isMuted, mutate])

  return { isMuted, toggleMute }
}

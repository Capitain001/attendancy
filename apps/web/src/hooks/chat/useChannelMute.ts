// src/hooks/chat/useChannelMute.ts
'use client'

import { useCallback } from 'react'
import { useLocalStorage } from '../utils/use-local-storage'


const muteKey = (channelId: string) => `chat:mute:${channelId}`

export function useChannelMute(channelId: string) {
  const [isMuted, setIsMuted] = useLocalStorage<boolean>(muteKey(channelId), false)

  const toggleMute = useCallback(() => setIsMuted((prev) => !prev), [setIsMuted])

  return { isMuted, toggleMute }
}
//src/hook/use-realtime-chat
'use client'


import { PresenceUser } from '@/types'
import { createClient } from '@/utils/supabase/client'
import { useCallback, useEffect, useState } from 'react'

interface UseRealtimeChatProps {
  roomName: string
  user?: PresenceUser 
}

export interface ChatMessage {
  id: string
  content: string
  user: {
    name: string
  }
  createdAt: string
}

const EVENT_MESSAGE_TYPE = 'message'

export function useRealtimeChat({ roomName, user}: UseRealtimeChatProps) {
  const supabase = createClient()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [channel, setChannel] = useState<ReturnType<typeof supabase.channel> | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [connectedUsers, setConnectedUsers] = useState<Record<string, PresenceUser>>({})

  const presenceKey = user?.id 
  const userName = user?.name || 'Anonyme'

  useEffect(() => {
    if (!presenceKey) return

    const newChannel = supabase.channel(roomName, {
      config: {
        presence: {
          key: presenceKey,
        },
      },
    })

    newChannel
      .on('presence', { event: 'sync' }, () => {
        const newState = newChannel.presenceState<PresenceUser>()

        // Grouper par userId pour éviter les doublons (même utilisateur sur plusieurs appareils)
        const usersByUserId = new Map<string, PresenceUser>()
        
        Object.entries(newState).forEach(([key, values]) => {
          const userInfo: PresenceUser = values[0] 
          if (!userInfo?.id) return
          
          const existingUser = usersByUserId.get(userInfo.id)
          
          // Garder la connexion la plus récente (basée sur online_at)
          if (!existingUser) {
            usersByUserId.set(userInfo.id, userInfo)
          } else {
            const existingTime = existingUser.online_at
              ? new Date(existingUser.online_at as string).getTime()
              : 0
            const newTime = userInfo.online_at
              ? new Date(userInfo.online_at as string).getTime()
              : 0
            
            if (newTime > existingTime) {
              usersByUserId.set(userInfo.id, userInfo)
            }
          }
        })

        // Convertir la Map en Record indexé par userId
        const newUsers = Object.fromEntries(usersByUserId) as Record<string, PresenceUser>

        setConnectedUsers(newUsers)
      })
      .on('broadcast', { event: EVENT_MESSAGE_TYPE }, (payload) => {
        setMessages((current) => [...current, payload.payload as ChatMessage])
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          setIsConnected(true)
          
          // Si user est fourni, tracker avec toutes les données de PresenceUser
          if (user) {
            const userPayload = {
              id: user.id,
              name: user.name,
              email: user.email,
              role: user.role,
              avatar_url: user.avatar_url,
              function: user.function,
              status: user.status,
              online_at: new Date().toISOString(),
            }
            newChannel.track(userPayload)
          } else {
            // Fallback si user n'est pas fourni
            newChannel.track({ 
              id: presenceKey,
              name: userName,
            } )
          }
        } else {
          setConnectedUsers({})
        }
      })

    setChannel(newChannel)

    return () => {
      if (newChannel) {
        newChannel.untrack()
        supabase.removeChannel(newChannel)
      }
    }
  }, [roomName, user, presenceKey, userName, supabase])

  const sendMessage = useCallback(
    async (content: string, id?:string) => {
      if (!channel || !isConnected) return

      const message: ChatMessage = {
        id: id!,
        content,
        user: {
          name: userName,
        },
        createdAt: new Date().toISOString(),
      }

      // Update local state immediately for the sender
      setMessages((current) => [...current, message])

      await channel.send({
        type: 'broadcast',
        event: EVENT_MESSAGE_TYPE,
        payload: message,
      })

      return id; // Retourner l'ID pour confirmation
    },
    [channel, isConnected, userName]
  )

  return { messages, sendMessage, isConnected, connectedUsers }
}
// src/hooks/chat/use-realtime-chat.ts
'use client'

import { PresenceUser } from '@/types'
import { createClient } from '@/utils/supabase/client'
import type { GetMessagesDto } from '@/services/message'
import { useCallback, useEffect, useRef, useState } from 'react'
import { ANONYMOUS_NAME } from './constants'

interface UseRealtimeChatProps {
  channelId: string
  user?: PresenceUser
}

type PersistedMessage = GetMessagesDto[number]

// Les champs communs sont dérivés du DTO (Pick = liste blanche de ce qui transite en broadcast).
// createdAt est redéfini : Date côté base, chaîne ISO sur le canal temps réel (JSON).
// user est redéfini : le broadcast ne porte que l'id et le nom d'affichage.
// user.id est affirmé par l'émetteur : à utiliser pour la mise en page uniquement
// (alignement, regroupement), jamais pour un contrôle d'accès. null = auteur inconnu.
export type RealtimeMessage = Pick<PersistedMessage, 'id' | 'content' | 'parentId'> & {
  createdAt: string
  user: { id: string | null; name: string }
}

// parentId optionnel à l'envoi : un message racine n'a pas à le passer
type SendRealtimeMessageInput = Pick<RealtimeMessage, 'content' | 'id' | 'createdAt'> &
  Partial<Pick<RealtimeMessage, 'parentId'>>

// Payload tel que reçu : un client pas encore à jour peut omettre parentId / user.id
type ReceivedMessage = Omit<RealtimeMessage, 'parentId' | 'user'> & {
  parentId?: string | null
  user?: { id?: string | null; name?: string }
}

const EVENT_MESSAGE_TYPE = 'message'

export function useRealtimeChat({ channelId, user }: UseRealtimeChatProps) {
  const supabase = createClient()
  const [messages, setMessages] = useState<RealtimeMessage[]>([])
  const [channel, setChannel] = useState<ReturnType<typeof supabase.channel> | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [connectedUsers, setConnectedUsers] = useState<Record<string, PresenceUser>>({})

  const presenceKey = user?.id
  const userName = user?.name || ANONYMOUS_NAME

  // L'abonnement ne dépend que de channelId et de l'id : si le parent recrée l'objet `user`
  // à chaque rendu, le canal ne se réabonne pas (et ne vide pas les messages).
  // Déclaré AVANT l'effet d'abonnement pour que la ref soit à jour quand il s'exécute.
  const userRef = useRef(user)
  useEffect(() => {
    userRef.current = user
  }, [user])

  useEffect(() => {
    if (!presenceKey) return

    const newChannel = supabase.channel(channelId, {
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

        Object.entries(newState).forEach(([, values]) => {
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
        setConnectedUsers(Object.fromEntries(usersByUserId) as Record<string, PresenceUser>)
      })
      .on('broadcast', { event: EVENT_MESSAGE_TYPE }, ({ payload }) => {
        // Le payload vient d'un pair : on normalise pour respecter le type
        const received = payload as ReceivedMessage
        setMessages((current) => [
          ...current,
          {
            ...received,
            parentId: received.parentId ?? null,
            user: {
              id: received.user?.id ?? null,
              name: received.user?.name || ANONYMOUS_NAME,
            },
          },
        ])
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          setIsConnected(true)

          const current = userRef.current
          // Si user est fourni, tracker avec toutes les données de PresenceUser
          if (current) {
            newChannel.track({
              id: current.id,
              name: current.name,
              email: current.email,
              role: current.role,
              avatar_url: current.avatar_url,
              function: current.function,
              status: current.status,
              online_at: new Date().toISOString(),
            })
          } else {
            // Fallback si user n'est plus fourni
            newChannel.track({ id: presenceKey, name: ANONYMOUS_NAME })
          }
        } else {
          setIsConnected(false)
          setConnectedUsers({})
        }
      })

    setChannel(newChannel)

    return () => {
      newChannel.untrack()
      supabase.removeChannel(newChannel)
      // Reset au changement de canal (ou démontage) : rien de l'ancien canal ne subsiste
      setChannel(null)
      setIsConnected(false)
      setMessages([])
      setConnectedUsers({})
    }
  }, [channelId, presenceKey, supabase])

  const sendMessage = useCallback(
    async ({ content, id, createdAt, parentId }: SendRealtimeMessageInput) => {
      if (!channel || !isConnected || !presenceKey) return

      const message: RealtimeMessage = {
        id,
        content,
        parentId: parentId ?? null,
        user: {
          id: presenceKey,
          name: userName,
        },
        createdAt,
      }

      // Copie locale immédiate (dédupliquée avec la version persistée à l'affichage)
      setMessages((current) => [...current, message])

      await channel.send({
        type: 'broadcast',
        event: EVENT_MESSAGE_TYPE,
        payload: message,
      })

      return id // Retourner l'ID pour confirmation
    },
    [channel, isConnected, presenceKey, userName]
  )

  return { messages, sendMessage, isConnected, connectedUsers }
}
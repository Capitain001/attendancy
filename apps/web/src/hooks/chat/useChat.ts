// src/hooks/chat/useChat.ts
'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { type ChatMessage, useRealtimeChat } from '@/hooks/chat'
import { useChannelMute } from '@/hooks/chat/useChannelMute'
import { useMessages } from '@/hooks/data/chat/useMessages'
import { mapMessages } from '@/hooks/chat/utils'
import { PresenceUser } from '@/types'
import { sendParticipantNotificationsAction } from '@/services/notification/domains/chat'

interface UseChatProps {
  channelId: string
  user?: PresenceUser
  onMessage?: (messages: ChatMessage[]) => void
}

export const useChat = ({
  channelId,
  user,
  onMessage,
}: UseChatProps) => {
  const [newMessage, setNewMessage] = useState('')

  // Sourdine des notifications push, mémorisée par canal sur cet appareil
  const { isMuted, toggleMute } = useChannelMute(channelId)

  // Données persistées depuis la base de données
  const { data, create: persistMessage, loading } = useMessages({
    channelId,
    staleTime: 30_000,
  })

  // Communication en temps réel
  const {
    messages: realtimeMessages,
    sendMessage: sendRealtimeMessage,
    isConnected,
    connectedUsers,
  } = useRealtimeChat({ channelId, user })

  // Fusion des messages persistés et temps réel
  const messages = useMemo(() => {
    const persistedMessages = data?.items ? mapMessages(data.items) : []
    const mergedMessages = [...persistedMessages, ...realtimeMessages]

    // Éliminer les doublons par ID (le même id est utilisé en temps réel et en persistance)
    const uniqueMessages = mergedMessages.filter(
      (message, index, self) => index === self.findIndex((m) => m.id === message.id)
    )

    // Trier par date
    return uniqueMessages.sort((a, b) => a.createdAt.localeCompare(b.createdAt))
  }, [data?.items, realtimeMessages])

  // Filtrer les autres utilisateurs (exclure l'utilisateur actuel)
  const otherUsers = useMemo(() => {
    if (!user?.id) return []
    return Object.values(connectedUsers).filter(
      (connectedUser) => connectedUser.id && connectedUser.id !== user.id
    )
  }, [connectedUsers, user?.id])

  // Notifications push : le serveur résout les destinataires (membres du canal,
  // mentions comprises) à partir du seul channelId ; le client ne les connaît pas.
  const sendNotifications = useCallback(
    (messageId: string, content: string) => {
      if (isMuted) return

      sendParticipantNotificationsAction({ channelId, messageId, content }).catch((error) => {
        console.error('Erreur lors de l\'envoi des notifications push:', error)
      })
    },
    [isMuted, channelId]
  )

  // Envoi d'un message (temps réel + persistance + notifications)
  const sendMessage = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()

      if (!newMessage.trim() || !isConnected) return

      // Même id pour le temps réel et la persistance : clé d'idempotence côté
      // serveur, et déduplication côté affichage.
      const messageId = crypto.randomUUID()
      const createdAt = new Date().toISOString()
      const messageContent = newMessage.trim()

      // 1. Envoyer le message en temps réel
      sendRealtimeMessage({ id: messageId, content: messageContent, createdAt })

      // 2. Persister le message dans la base de données
      if (persistMessage) {
        persistMessage({
          id: messageId,
          createdAt,
          content: messageContent,
          channelId,
        })
      }

      // 3. Notifier les membres du canal
      sendNotifications(messageId, messageContent)

      // 4. Réinitialiser le champ de saisie
      setNewMessage('')
    },
    [newMessage, isConnected, sendRealtimeMessage, persistMessage, channelId, sendNotifications]
  )

  // Notifier le parent lorsque les messages changent
  useEffect(() => {
    if (onMessage) {
      onMessage(messages)
    }
  }, [messages, onMessage])

  return {
    // État
    messages,
    newMessage,
    setNewMessage,
    isConnected,
    loading,
    connectedUsers,
    otherUsers,

    // Actions
    sendMessage,

    // Utilitaires
    userName: user?.name || 'Anonyme',
    hasOtherUsers: otherUsers.length > 0,
    isMuted,
    toggleMute,
  }
}
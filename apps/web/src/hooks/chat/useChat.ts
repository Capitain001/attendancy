// hooks/chat/useChat.ts
'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { type ChatMessage, useRealtimeChat } from '@/hooks/chat'
import { useMessages } from '@/hooks/data/chat/useMessages'
import { mapMessages } from '@/hooks/chat/utils'
import { PresenceUser } from '@/types'
import { sendPushNotificationToUserById } from '@/modules/notification/user'
import { getRoomParticipantsAction, type ChatRoomParticipant } from '@/services/chat'

interface UseChatProps {
  roomName: string
  user?: PresenceUser
  onMessage?: (messages: ChatMessage[]) => void
}

export const useChat = ({
  roomName,
  user,
  onMessage,
}: UseChatProps) => {
  const [newMessage, setNewMessage] = useState('')
  const [participants, setParticipants] = useState<ChatRoomParticipant[]>([])
  const [isMuted, setIsMuted] = useState(false)
  
  // Données persistées depuis la base de données
  const { data, create: persistMessage, loading } = useMessages({
    roomName,
    staleTime: 30_000,
  })

  // Communication en temps réel
  const {
    messages: realtimeMessages,
    sendMessage: sendRealtimeMessage,
    isConnected,
    connectedUsers,
  } = useRealtimeChat({ roomName, user })

  // Fusion des messages persistés et temps réel
  const messages = useMemo(() => {
    const persistedMessages = data?.items ? mapMessages(data.items) : []
    const mergedMessages = [...persistedMessages, ...realtimeMessages]

    // Éliminer les doublons par ID
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

  const mentionDirectory = useMemo(() => {
    const normalize = (value: string) =>
      value
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9._-]/g, '')

    const byHandle = new Map<string, ChatRoomParticipant>()
    for (const participant of participants) {
      const displayName = [participant.user.firstName, participant.user.lastName].filter(Boolean).join(' ')
      const nameTokens = displayName.split(/\s+/).filter(Boolean)
      const primaryHandle = normalize(nameTokens[0] ?? displayName)
      if (primaryHandle) byHandle.set(primaryHandle, participant)

      const fullHandle = normalize(displayName.replace(/\s+/g, ''))
      if (fullHandle) byHandle.set(fullHandle, participant)
    }
    return byHandle
  }, [participants])

  const extractMentionTargets = useCallback(
    (content: string) => {
      const targets = new Map<string, ChatRoomParticipant>()
      const mentionRegex = /@([a-zA-Z0-9._-]+)/g
      const matches = content.matchAll(mentionRegex)
      for (const match of matches) {
        const rawHandle = match[1]?.toLowerCase()
        if (!rawHandle) continue
        const participant = mentionDirectory.get(rawHandle)
        if (!participant || !participant.userId || participant.userId === user?.id) continue
        targets.set(participant.userId, participant)
      }
      return Array.from(targets.values())
    },
    [mentionDirectory, user?.id]
  )

  useEffect(() => {
    const muteKey = `chat:mute:${roomName}`
    const saved = typeof window !== 'undefined' ? window.localStorage.getItem(muteKey) : null
    setIsMuted(saved === '1')
  }, [roomName])

  useEffect(() => {
    let cancelled = false

    async function loadParticipants() {
      const response = await getRoomParticipantsAction(roomName)
      if (cancelled) return
      setParticipants(response.data ?? [])
    }

    loadParticipants()
    return () => {
      cancelled = true
    }
  }, [roomName])

  const toggleMute = useCallback(() => {
    const next = !isMuted
    setIsMuted(next)
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(`chat:mute:${roomName}`, next ? '1' : '0')
    }
  }, [isMuted, roomName])

  // Envoi de notifications push aux autres utilisateurs
  const sendNotifications = useCallback(
    async (messageContent: string) => {
      if (isMuted) return
      if (otherUsers.length === 0) return

      try {
        const mentionTargets = extractMentionTargets(messageContent)
        const toRecipient = (p: ChatRoomParticipant) => ({
          id: p.userId,
          name: [p.user.firstName, p.user.lastName].filter(Boolean).join(' ') || p.userId,
          email: '',
          avatarUrl: p.user.avatar_url ?? null,
        })
        const recipients =
          mentionTargets.length > 0
            ? mentionTargets.map(toRecipient)
            : otherUsers
                .filter((connectedUser) => connectedUser.id)
                .map((connectedUser) => ({
                  id: connectedUser.id!,
                  name: connectedUser.name ?? connectedUser.email ?? 'Utilisateur',
                  email: connectedUser.email ?? '',
                  avatarUrl: connectedUser.avatar_url ?? null,
                }))

        await Promise.allSettled(
          recipients.map(async (recipient) => {
            if (!recipient.id) return

            await sendPushNotificationToUserById(recipient.id, {
              message:
                mentionTargets.length > 0
                  ? `${user?.name || 'Anonyme'} vous a mentionné: ${messageContent}`
                  : messageContent,
            })
          })
        )
      } catch (error) {
        console.error('Erreur lors de l\'envoi des notifications push:', error)
      }
    },
    [isMuted, otherUsers, extractMentionTargets, roomName, user]
  )

  // Envoi d'un message (temps réel + persistance + notifications)
  const sendMessage = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      
      if (!newMessage.trim() || !isConnected) return

      const messageId = crypto.randomUUID()
      const messageContent = newMessage.trim()

      // 1. Envoyer le message en temps réel
      sendRealtimeMessage(messageContent, messageId)
      
      // 2. Persister le message dans la base de données
      if (persistMessage) {
        persistMessage({
          content: messageContent,
          channelId: roomName,
        })
      }
      
      // 3. Envoyer des notifications aux autres utilisateurs
      sendNotifications(messageContent)
      
      // 4. Réinitialiser le champ de saisie
      setNewMessage('')
    },
    [newMessage, isConnected, sendRealtimeMessage, persistMessage, roomName, sendNotifications]
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
    participants,
    isMuted,
    toggleMute,
  }
}
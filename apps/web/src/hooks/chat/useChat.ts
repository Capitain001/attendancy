// src/hooks/chat/useChat.ts
'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRealtimeChat, type RealtimeMessage } from '@/hooks/chat/use-realtime-chat'
import { ANONYMOUS_NAME } from '@/hooks/chat/constants'
import { useChannelMute } from '@/hooks/chat/useChannelMute'
import type { ChatMessage, OutboxDraft, OutboxEntry } from '@/hooks/chat/types'
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
  // Message auquel on répond (null = message racine)
  const [replyToId, setReplyToId] = useState<string | null>(null)
  // Envois locaux non confirmés (sending / failed), indexés par id de message
  const [outbox, setOutbox] = useState<Record<string, OutboxEntry>>({})

  // Sourdine des notifications push, mémorisée par canal sur cet appareil
  const { isMuted, toggleMute } = useChannelMute(channelId)

  // Données persistées depuis la base de données
  const { data, create: persistMessage, loading } = useMessages({
    channelId,
    user, // identité de l'expéditeur, pour reconstruire le message dans le cache
    staleTime: 30_000,
  })

  // Communication en temps réel
  const {
    messages: realtimeMessages,
    sendMessage: sendRealtimeMessage,
    isConnected,
    connectedUsers,
  } = useRealtimeChat({ channelId, user })

  // Fusion : persisté > temps réel > outbox (le premier rencontré gagne, par id).
  // Pendant 'sending', l'outbox est la seule trace du message : on diffuse après la base.
  const messages = useMemo<ChatMessage[]>(() => {
    const persisted = data?.items ? mapMessages(data.items) : []

    const pending: RealtimeMessage[] = Object.entries(outbox)
      .filter(([, entry]) => entry.channelId === channelId)
      .map(([id, entry]) => ({
        id,
        content: entry.content,
        parentId: entry.parentId,
        createdAt: entry.createdAt,
        user: { id: user?.id ?? null, name: user?.name || ANONYMOUS_NAME },
      }))

    const merged = new Map<string, RealtimeMessage>()
    for (const message of [...persisted, ...realtimeMessages, ...pending]) {
      if (!merged.has(message.id)) merged.set(message.id, message)
    }

    return [...merged.values()]
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
      .map((message) => ({
        ...message,
        isOwn: !!user?.id && message.user.id === user.id,
        status: outbox[message.id]?.status ?? 'sent',
      }))
  }, [data?.items, realtimeMessages, outbox, channelId, user?.id, user?.name])

  // Filtrer les autres utilisateurs (exclure l'utilisateur actuel)
  const otherUsers = useMemo(() => {
    if (!user?.id) return []
    return Object.values(connectedUsers).filter(
      (connectedUser) => connectedUser.id && connectedUser.id !== user.id
    )
  }, [connectedUsers, user?.id])

  // Notifications push : le serveur résout les destinataires (membres du canal,
  // mentions comprises) à partir du seul channelId ; le client ne les connaît pas.
  // Le canal est passé en paramètre : un retry ne doit pas dépendre du canal courant.
  const sendNotifications = useCallback(
    (targetChannelId: string, messageId: string, content: string) => {
      if (isMuted) return

      sendParticipantNotificationsAction({ channelId: targetChannelId, messageId, content }).catch(
        (error) => {
          console.error('Erreur lors de l\'envoi des notifications push:', error)
        }
      )
    },
    [isMuted]
  )

  // Persistance seule dans le try : si le broadcast ou le push échoue, le message n'est
  // pas marqué 'failed' (il est en base) et un retry ne le republie pas à tort.
  const persist = useCallback(
    async (id: string, draft: OutboxDraft) => {
      setOutbox((current) => ({ ...current, [id]: { ...draft, status: 'sending' } }))

      try {
        await persistMessage?.({ id, ...draft })
      } catch {
        // Le toast d'erreur est déjà affiché par useCrudEntity
        setOutbox((current) => ({ ...current, [id]: { ...draft, status: 'failed' } }))
        return
      }

      // Invariant : une entrée d'outbox = jamais diffusée. On diffuse donc ici, y compris
      // pour un retry (la base est idempotente, la diffusion le devient par cet invariant).
      sendRealtimeMessage({
        id,
        content: draft.content,
        createdAt: draft.createdAt,
        parentId: draft.parentId,
      }).catch((error) => console.error('Erreur lors de la diffusion temps réel:', error))
      sendNotifications(draft.channelId, id, draft.content)

      setOutbox(({ [id]: _done, ...rest }) => rest)
    },
    [persistMessage, sendRealtimeMessage, sendNotifications]
  )

  // Envoi d'un message : affichage immédiat via l'outbox, puis persistance,
  // puis diffusion + notifications une fois le message sécurisé en base.
  const sendMessage = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()

      const content = newMessage.trim()
      if (!content || !isConnected) return

      // Même id pour la persistance et la diffusion : clé d'idempotence côté
      // serveur, et déduplication côté affichage.
      const messageId = crypto.randomUUID()

      void persist(messageId, {
        channelId,
        content,
        createdAt: new Date().toISOString(),
        parentId: replyToId,
      })

      setNewMessage('')
      setReplyToId(null)
    },
    [newMessage, isConnected, persist, channelId, replyToId]
  )

  // Rejeu d'un envoi échoué : même id, donc sans doublon côté serveur
  const retryMessage = useCallback(
    (id: string) => {
      const entry = outbox[id]
      if (entry?.status !== 'failed') return

      const { channelId: entryChannelId, content, createdAt, parentId } = entry
      void persist(id, { channelId: entryChannelId, content, createdAt, parentId })
    },
    [outbox, persist]
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
    replyToId,
    setReplyToId,
    isConnected,
    loading,
    connectedUsers,
    otherUsers,

    // Actions
    sendMessage,
    retryMessage,

    // Utilitaires
    userName: user?.name || ANONYMOUS_NAME,
    hasOtherUsers: otherUsers.length > 0,
    isMuted,
    toggleMute,
  }
}
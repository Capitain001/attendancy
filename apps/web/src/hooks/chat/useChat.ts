// src/hooks/chat/useChat.ts
'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { useRealtimeChat, type RealtimeMessage } from '@/hooks/chat/use-realtime-chat'
import { ANONYMOUS_NAME } from '@/hooks/chat/constants'
import { useChannelMute } from '@/hooks/chat/useChannelMute'
import type { ChatMessage, MessageStatus, ReplyPreview } from '@/hooks/chat/types'
import { useMessages } from '@/hooks/data/messages/useMessages'
import { mapMessages, mapReplySnapshots, resolveReplyTo } from '@/hooks/chat/utils'
import { truncatePreview } from '@/services/message/utils'
import type { PresenceUser } from '@attendancy/user'
import { useChatSync, useChatSyncState, registerRealtimeSender } from '@/modules/chat'

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
  // Le canal est mémorisé : une réponse commencée dans un autre
  // canal est ignorée et ne part jamais avec un parent étranger.
  const [replyTarget, setReplyTarget] = useState<{ id: string; channelId: string } | null>(null)
  const replyToId = replyTarget?.channelId === channelId ? replyTarget.id : null

  // Sourdine des notifications push, mémorisée par canal sur cet appareil
  const { isMuted, toggleMute } = useChannelMute(channelId)

  // Synchronisation offline / LAN
  const sync = useChatSync()
  const { outbox: outboxItems, inbox: inboxEnvelopes } = useChatSyncState(channelId)

  // Données persistées depuis la base de données
  const {
    data,
    update: updateMessageEntity,
    delete: deleteMessageEntity,
    refetch: refetchMessages,
    loading,
    hasMore,
    loadOlder,
    loadUntil,
    isLoadingOlder,
  } = useMessages({
    channelId,
    user, // identité de l'expéditeur, pour reconstruire le message dans le cache
    staleTime: 30_000,
  })

  // Communication en temps réel
  const {
    messages: realtimeMessages,
    patches,
    deletedIds,
    sendMessage: sendRealtimeMessage,
    publishEdit,
    publishDelete,
    isConnected,
    reconnectCount,
    connectedUsers,
    typingIds,
    notifyTyping,
  } = useRealtimeChat({ channelId, user })

  // Le moteur (hors React) diffuse via le hook temps réel de CE canal
  useEffect(() => registerRealtimeSender(channelId, sendRealtimeMessage), [channelId, sendRealtimeMessage])

  // Un message de pair déjà confirmé par le serveur n'a plus besoin de sa copie « non vérifiée »
  useEffect(() => {
    if (!sync || inboxEnvelopes.length === 0 || !data?.items?.length) return
    const persistedIds = new Set(data.items.map((m) => m.id))
    const done = inboxEnvelopes.filter((e) => persistedIds.has(e.id)).map((e) => e.id)
    if (done.length) void sync.confirm(done)
  }, [sync, inboxEnvelopes, data?.items])

  // Après une reconnexion, les éditions / suppressions émises pendant la coupure sont perdues :
  // on resynchronise la fenêtre récente depuis le serveur (reconcileMessages préserve l'historique).
  useEffect(() => {
    if (reconnectCount > 0) void refetchMessages()
  }, [reconnectCount, refetchMessages])

  // Fusion : persisté > temps réel > pair non vérifié > envoi local (le premier rencontré gagne, par id).
  // Les pierres tombales et les éditions s'appliquent ensuite à toutes les sources.
  const messages = useMemo<ChatMessage[]>(() => {
    const persisted = data?.items ? mapMessages(data.items) : []

    const pending: RealtimeMessage[] = outboxItems
      .filter((item) => item.channelId === channelId)
      .map((item) => ({
        id: item.id,
        content: item.content,
        parentId: item.parentId,
        createdAt: item.createdAt,
        editedAt: null,
        user: { id: user?.id ?? null, name: user?.name || ANONYMOUS_NAME },
      }))

    // Messages de pairs (LAN) pas encore confirmés par le serveur
    const unverified: RealtimeMessage[] = inboxEnvelopes
      .filter((env) => env.channelId === channelId)
      .map((env) => ({
        id: env.id,
        content: env.content,
        parentId: env.parentId ?? null,
        createdAt: env.createdAt,
        editedAt: null,
        user: { id: env.authorId, name: env.authorName || ANONYMOUS_NAME },
      }))

    // Priorité par id : persisté > temps réel > pair non vérifié > envoi local
    type Source = 'persisted' | 'realtime' | 'inbox' | 'outbox'
    const merged = new Map<string, RealtimeMessage>()
    const sources = new Map<string, Source>()
    const add = (list: RealtimeMessage[], source: Source) => {
      for (const message of list) {
        if (merged.has(message.id)) continue
        merged.set(message.id, message)
        sources.set(message.id, source)
      }
    }
    add(persisted, 'persisted')
    add(realtimeMessages, 'realtime')
    add(unverified, 'inbox')
    add(pending, 'outbox')
    const failedIds = new Set(outboxItems.filter((i) => i.status === 'failed').map((i) => i.id))

    const snapshots = mapReplySnapshots(data?.items)

    // Éditions appliquées AVANT le filtre : un parent supprimé garde ainsi son auteur connu
    const patched = [...merged.values()].map((message) => {
      const patch = patches[message.id]
      return patch && (!message.editedAt || message.editedAt < patch.editedAt)
        ? { ...message, content: patch.content, editedAt: patch.editedAt }
        : message
    })
    const loadedById = new Map(patched.map((message) => [message.id, message]))

    return patched
      .filter((message) => !deletedIds.has(message.id))
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
      .map((message) => {
        const source = sources.get(message.id)
        const status: MessageStatus =
          source === 'outbox'
            ? failedIds.has(message.id)
              ? 'failed'
              : 'sending'
            : source === 'inbox'
              ? 'unverified'
              : 'sent'

        return {
          ...message,
          isOwn: !!user?.id && message.user.id === user.id,
          status,
          replyTo: resolveReplyTo(message.parentId, loadedById, snapshots, deletedIds),
        }
      })
  }, [data?.items, realtimeMessages, outboxItems, inboxEnvelopes, patches, deletedIds, channelId, user?.id, user?.name])

  // Aperçu du bandeau : dérivé des messages affichés, donc à jour si le parent est édité
  const replyingTo = useMemo<ReplyPreview | null>(() => {
    const target = replyToId ? messages.find((m) => m.id === replyToId) : undefined
    return target
      ? {
        id: target.id,
        authorName: target.user.name,
        content: truncatePreview(target.content),
        state: 'available',
      }
      : null
  }, [replyToId, messages])

  const startReply = useCallback(
    (messageId: string) => {
      const target = messages.find((m) => m.id === messageId)
      if (!target || target.status === 'failed') return
      setReplyTarget({ id: messageId, channelId })
    },
    [messages, channelId]
  )

  const cancelReply = useCallback(() => setReplyTarget(null), [])

  // Parent supprimé pendant la rédaction : on abandonne la réponse plutôt que de la laisser échouer
  useEffect(() => {
    if (!replyTarget) return
    if (replyTarget.channelId !== channelId) return setReplyTarget(null) // changement de canal : silencieux
    if (!messages.some((m) => m.id === replyTarget.id)) {
      setReplyTarget(null)
      toast.info("Le message auquel vous répondiez n'est plus disponible")
    }
  }, [replyTarget, channelId, messages])

  // Filtrer les autres utilisateurs (exclure l'utilisateur actuel)
  const otherUsers = useMemo(() => {
    if (!user?.id) return []
    return Object.values(connectedUsers).filter(
      (connectedUser) => connectedUser.id && connectedUser.id !== user.id
    )
  }, [connectedUsers, user?.id])

  // Chaque modification du champ annonce (ou retire) « en train d'écrire »
  const updateNewMessage = useCallback(
    (value: React.SetStateAction<string>) => {
      setNewMessage((prev) => {
        const next = typeof value === 'function' ? value(prev) : value
        notifyTyping(next.trim().length > 0)
        return next
      })
    },
    [notifyTyping]
  )

  const typingUsers = useMemo(
    () =>
      [...typingIds]
        .map((id) => connectedUsers[id])
        .filter((u): u is PresenceUser => !!u),
    [typingIds, connectedUsers]
  )

  const sendMessage = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      const content = newMessage.trim()
      // Plus de garde `isConnected` : l'envoi marche hors ligne, l'outbox est persistante
      if (!content || !sync) return

      setNewMessage('')
      notifyTyping(false)
      setReplyTarget(null)
      await sync.engine.send({ channelId, content, parentId: replyToId })
    },
    [newMessage, sync, channelId, replyToId, notifyTyping]
  )

  const retryMessage = useCallback(
    (id: string, { withoutReply = false }: { withoutReply?: boolean } = {}) =>
      sync?.engine.retry(id, withoutReply ? { parentId: null } : undefined),
    [sync]
  )

  const discardMessage = useCallback((id: string) => sync?.engine.discard(id), [sync])

  // Édition : le serveur d'abord (seul l'auteur est autorisé, contrôlé côté serveur),
  // puis diffusion aux autres. isOwn ne sert qu'à afficher ou non le bouton.
  // Retourne false en cas d'échec (le toast d'erreur est déjà affiché par useCrudEntity).
  const editMessage = useCallback(
    async (id: string, content: string) => {
      try {
        // useCrudEntity expose mutateAsync : un seul objet { id, data }
        const updated = await updateMessageEntity?.({ id, data: { content } })
        if (!updated) return false

        // editedAt posé par le serveur : référence pour départager deux éditions croisées.
        // Absent = rien n'a changé côté serveur, rien à diffuser.
        if (updated.editedAt) {
          publishEdit({
            id,
            content: updated.content ?? content, // texte validé (trim) par le serveur
            editedAt: new Date(updated.editedAt).toISOString(),
          }).catch((error) => console.error('Erreur lors de la diffusion de l\'édition:', error))
        }
        return true
      } catch {
        return false
      }
    },
    [updateMessageEntity, publishEdit]
  )

  const deleteMessage = useCallback(
    async (id: string) => {
      try {
        await deleteMessageEntity?.(id)
      } catch {
        return false
      }

      publishDelete(id).catch((error) =>
        console.error('Erreur lors de la diffusion de la suppression:', error)
      )
      return true
    },
    [deleteMessageEntity, publishDelete]
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
    setNewMessage: updateNewMessage,
    replyingTo,
    startReply,
    cancelReply,
    isConnected,
    loading,
    connectedUsers,
    typingUsers,
    otherUsers,

    // Historique
    hasMore,
    loadOlderMessages: loadOlder,
    jumpToMessage: loadUntil,
    isLoadingOlder,

    // Actions
    sendMessage,
    retryMessage,
    discardMessage,
    editMessage,
    deleteMessage,

    // Utilitaires
    userName: user?.name || ANONYMOUS_NAME,
    hasOtherUsers: otherUsers.length > 0,
    isMuted,
    toggleMute,
  }
}

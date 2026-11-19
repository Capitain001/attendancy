// src/hooks/chat/useChat.ts
'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { useRealtimeChat, type RealtimeMessage } from '@/hooks/chat/use-realtime-chat'
import { ANONYMOUS_NAME } from '@/hooks/chat/constants'
import { useChannelMute } from '@/hooks/chat/useChannelMute'
import type { ChatMessage, OutboxDraft, OutboxEntry, ReplyPreview } from '@/hooks/chat/types'
import { useMessages } from '@/hooks/data/messages/useMessages'
import { mapMessages, mapReplySnapshots, resolveReplyTo } from '@/hooks/chat/utils'
import { truncatePreview } from '@/services/message/preview'
import { PresenceUser } from '@/types'
import { notifyChannelMembersAction } from '@/services/notification/domains/chat'

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

  // Envois locaux non confirmés (sending / failed), indexés par id de message
  const [outbox, setOutbox] = useState<Record<string, OutboxEntry>>({})

  // Sourdine des notifications push, mémorisée par canal sur cet appareil
  const { isMuted, toggleMute } = useChannelMute(channelId)

  // Données persistées depuis la base de données
  const {
    data,
    create: persistMessage,
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

  // Après une reconnexion, les éditions / suppressions émises pendant la coupure sont perdues :
  // on resynchronise la fenêtre récente depuis le serveur (reconcileMessages préserve l'historique).
  useEffect(() => {
    if (reconnectCount > 0) void refetchMessages()
  }, [reconnectCount, refetchMessages])

  // Fusion : persisté > temps réel > outbox (le premier rencontré gagne, par id).
  // Pendant 'sending', l'outbox est la seule trace du message : on diffuse après la base.
  // Les pierres tombales et les éditions s'appliquent ensuite à toutes les sources.
  const messages = useMemo<ChatMessage[]>(() => {
    const persisted = data?.items ? mapMessages(data.items) : []

    const pending: RealtimeMessage[] = Object.entries(outbox)
      .filter(([, entry]) => entry.channelId === channelId)
      .map(([id, entry]) => ({
        id,
        content: entry.content,
        parentId: entry.parentId,
        createdAt: entry.createdAt,
        editedAt: null,
        user: { id: user?.id ?? null, name: user?.name || ANONYMOUS_NAME },
      }))

    const merged = new Map<string, RealtimeMessage>()
    for (const message of [...persisted, ...realtimeMessages, ...pending]) {
      if (!merged.has(message.id)) merged.set(message.id, message)
    }

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
      .map((message) => ({
        ...message,
        isOwn: !!user?.id && message.user.id === user.id,
        status: outbox[message.id]?.status ?? 'sent',
        replyTo: resolveReplyTo(message.parentId, loadedById, snapshots, deletedIds),
      }))
  }, [data?.items, realtimeMessages, patches, deletedIds, outbox, channelId, user?.id, user?.name])

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
      // Seul un message confirmé en base peut être cité : le serveur refuse un parent inexistant
      if (messages.find((m) => m.id === messageId)?.status !== 'sent') return
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

  // Notifications push : le serveur résout les destinataires (membres du canal,
  // mentions comprises) à partir du seul channelId ; le client ne les connaît pas.
  // Le canal est passé en paramètre : un retry ne doit pas dépendre du canal courant.

  const sendNotifications = useCallback(
    (targetChannelId: string, messageId: string) => {
      // Plus de `if (isMuted) return` : la sourdine de l'expéditeur ne concerne que ses propres
      // notifications, le serveur filtre selon celle de chaque destinataire.
      notifyChannelMembersAction({ channelId: targetChannelId, messageId })
        .then((res) => { if (res && 'error' in res) console.error('Notifications push refusées:', res.error) })
        .catch((error) => console.error('Erreur lors de l\'envoi des notifications push:', error))
    },
    []
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
      sendNotifications(draft.channelId, id)

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
      notifyTyping(false)
      setReplyTarget(null)
    },
    [newMessage, isConnected, persist, channelId, replyToId, notifyTyping]
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
    editMessage,
    deleteMessage,

    // Utilitaires
    userName: user?.name || ANONYMOUS_NAME,
    hasOtherUsers: otherUsers.length > 0,
    isMuted,
    toggleMute,
  }
}

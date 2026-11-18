// src/hooks/chat/use-realtime-chat.ts
'use client'

import { PresenceUser } from '@/types'
import { createClient } from '@/utils/supabase/client'
import type { GetMessagesDto } from '@/services/message'
import { useCallback, useEffect, useRef, useState } from 'react'
import { ANONYMOUS_NAME, TYPING_EXPIRE_MS, TYPING_THROTTLE_MS } from './constants'

interface UseRealtimeChatProps {
  channelId: string
  user?: PresenceUser
}

type PersistedMessage = GetMessagesDto[number]

// Les champs communs sont dérivés du DTO (Pick = liste blanche de ce qui transite en broadcast).
// createdAt / editedAt sont redéfinis : Date côté base, chaîne ISO sur le canal temps réel (JSON).
// user est redéfini : le broadcast ne porte que l'id et le nom d'affichage.
// user.id est affirmé par l'émetteur : à utiliser pour la mise en page uniquement
// (alignement, regroupement), jamais pour un contrôle d'accès. null = auteur inconnu.
export type RealtimeMessage = Pick<PersistedMessage, 'id' | 'content' | 'parentId'> & {
  createdAt: string
  // Posé par le serveur à chaque édition (null = jamais modifié). Sert aussi de version.
  editedAt: string | null
  user: { id: string | null; name: string }
}

// Édition reçue ou émise : surcouche d'affichage par-dessus le message (cache / temps réel)
export type MessagePatch = { content: string; editedAt: string }
type MessageUpdateEvent = MessagePatch & { id: string }
type MessageDeleteEvent = { id: string }

// parentId optionnel à l'envoi : un message racine n'a pas à le passer
type SendRealtimeMessageInput = Pick<RealtimeMessage, 'content' | 'id' | 'createdAt'> &
  Partial<Pick<RealtimeMessage, 'parentId'>>

// Payload tel que reçu : un client pas encore à jour peut omettre parentId / editedAt / user.id
type ReceivedMessage = Omit<RealtimeMessage, 'parentId' | 'editedAt' | 'user'> & {
  parentId?: string | null
  editedAt?: string | null
  user?: { id?: string | null; name?: string }
}

const EVENT_MESSAGE_TYPE = 'message'
const EVENT_UPDATE = 'message:update'
const EVENT_DELETE = 'message:delete'
const EVENT_TYPING = 'typing'

type TypingEvent = { id: string; typing: boolean }

const isTypingEvent = (payload: unknown): payload is TypingEvent => {
  const e = payload as Partial<TypingEvent> | null
  return typeof e?.id === 'string' && typeof e.typing === 'boolean'
}

const withoutId = (current: ReadonlySet<string>, id: string): ReadonlySet<string> => {
  if (!current.has(id)) return current
  const next = new Set(current)
  next.delete(id)
  return next
}

// Un broadcast vient d'un pair, donc non fiable : on vérifie la forme avant de l'appliquer.
const isUpdateEvent = (payload: unknown): payload is MessageUpdateEvent => {
  const e = payload as Partial<MessageUpdateEvent> | null
  return typeof e?.id === 'string' && typeof e.content === 'string' && typeof e.editedAt === 'string'
}
const isDeleteEvent = (payload: unknown): payload is MessageDeleteEvent =>
  typeof (payload as Partial<MessageDeleteEvent> | null)?.id === 'string'

// L'édition la plus récente gagne (ISO 8601 : l'ordre lexicographique est l'ordre chronologique)
const withPatch = (
  current: Record<string, MessagePatch>,
  { id, ...patch }: MessageUpdateEvent
): Record<string, MessagePatch> =>
  !current[id] || current[id].editedAt < patch.editedAt ? { ...current, [id]: patch } : current

const withDeleted = (current: ReadonlySet<string>, id: string): ReadonlySet<string> =>
  current.has(id) ? current : new Set(current).add(id)

export function useRealtimeChat({ channelId, user }: UseRealtimeChatProps) {
  // Instance stable : supabase figure dans les deps de l'effet d'abonnement
  const [supabase] = useState(() => createClient())
  const [messages, setMessages] = useState<RealtimeMessage[]>([])
  // Surcouches d'édition et pierres tombales : valables pour toutes les sources de messages
  const [patches, setPatches] = useState<Record<string, MessagePatch>>({})
  const [deletedIds, setDeletedIds] = useState<ReadonlySet<string>>(() => new Set())
  const [channel, setChannel] = useState<ReturnType<typeof supabase.channel> | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  // Incrémenté à chaque RE-connexion (pas la première) : les événements émis pendant la
  // coupure sont perdus, l'appelant resynchronise alors depuis le serveur.
  const [reconnectCount, setReconnectCount] = useState(0)
  const [connectedUsers, setConnectedUsers] = useState<Record<string, PresenceUser>>({})
  // Ids des utilisateurs qui écrivent. Les noms sont résolus par l'appelant via la présence.
  const [typingIds, setTypingIds] = useState<ReadonlySet<string>>(() => new Set())
  // Un minuteur d'expiration par utilisateur : pas de polling, rendu seulement quand ça change
  const typingTimers = useRef(new Map<string, ReturnType<typeof setTimeout>>())
  // Ref et non state : le throttle ne doit pas provoquer de rendu
  const lastTypingSentRef = useRef(0)

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

    let wasSubscribed = false

    const timers = typingTimers.current

    const clearTyping = (id: string) => {
      const timer = timers.get(id)
      if (timer) clearTimeout(timer)
      timers.delete(id)
      setTypingIds((current) => withoutId(current, id))
    }

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
        if (received.user?.id) clearTyping(received.user.id)
        setMessages((current) => [
          ...current,
          {
            ...received,
            parentId: received.parentId ?? null,
            editedAt: received.editedAt ?? null,
            user: {
              id: received.user?.id ?? null,
              name: received.user?.name || ANONYMOUS_NAME,
            },
          },
        ])
      })
      .on('broadcast', { event: EVENT_UPDATE }, ({ payload }) => {
        if (isUpdateEvent(payload)) setPatches((current) => withPatch(current, payload))
      })
      .on('broadcast', { event: EVENT_DELETE }, ({ payload }) => {
        if (isDeleteEvent(payload)) setDeletedIds((current) => withDeleted(current, payload.id))
      })
      .on('broadcast', { event: EVENT_TYPING }, ({ payload }) => {
        if (!isTypingEvent(payload) || payload.id === presenceKey) return
        const { id, typing } = payload

        if (!typing) return clearTyping(id)

        const previous = timers.get(id)
        if (previous) clearTimeout(previous)
        setTypingIds((current) => (current.has(id) ? current : new Set(current).add(id)))
        timers.set(id, setTimeout(() => clearTyping(id), TYPING_EXPIRE_MS))
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          setIsConnected(true)
          if (wasSubscribed) setReconnectCount((count) => count + 1)
          wasSubscribed = true

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
      setReconnectCount(0)
      setMessages([])
      setPatches({})
      setDeletedIds(new Set())
      timers.forEach(clearTimeout)
      timers.clear()
      lastTypingSentRef.current = 0
      setTypingIds(new Set())
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
        editedAt: null,
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

  // À appeler APRÈS le succès serveur : personne ne voit une modification absente de la base.
  // La surcouche locale s'applique toujours (la base est déjà à jour) ; seule la diffusion
  // dépend de la connexion. Nécessaire aussi pour l'auteur : un message qu'il a envoyé vit
  // encore dans `messages` (copie temps réel) et ne doit pas réapparaître avec l'ancien texte.
  const publishEdit = useCallback(
    async (event: MessageUpdateEvent) => {
      setPatches((current) => withPatch(current, event))
      if (!channel || !isConnected) return
      await channel.send({ type: 'broadcast', event: EVENT_UPDATE, payload: event })
    },
    [channel, isConnected]
  )

  const publishDelete = useCallback(
    async (id: string) => {
      setDeletedIds((current) => withDeleted(current, id))
      if (!channel || !isConnected) return
      await channel.send({
        type: 'broadcast',
        event: EVENT_DELETE,
        payload: { id } satisfies MessageDeleteEvent,
      })
    },
    [channel, isConnected]
  )

  // typing: true est limité à un envoi toutes les TYPING_THROTTLE_MS ; typing: false (envoi du
  // message, champ vidé) part tout de suite, mais seulement si un « écrit » avait été annoncé.
  const notifyTyping = useCallback(
    (typing: boolean) => {
      if (!channel || !isConnected || !presenceKey) return

      if (typing) {
        const now = Date.now()
        if (now - lastTypingSentRef.current < TYPING_THROTTLE_MS) return
        lastTypingSentRef.current = now
      } else {
        if (lastTypingSentRef.current === 0) return
        lastTypingSentRef.current = 0
      }

      // Éphémère : un échec n'a aucune conséquence, on ne le remonte pas
      void channel.send({
        type: 'broadcast',
        event: EVENT_TYPING,
        payload: { id: presenceKey, typing } satisfies TypingEvent,
      })
    },
    [channel, isConnected, presenceKey]
  )

  return {
    messages,
    patches,
    deletedIds,
    typingIds,
    notifyTyping,
    sendMessage,
    publishEdit,
    publishDelete,
    isConnected,
    reconnectCount,
    connectedUsers,
  }
}
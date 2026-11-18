// src/hooks/data/chat/useOlderMessages.ts
'use client'

import { useCallback, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import { mergeItemsById } from '@/hooks/entity/useEntity'
import { getOlderMessagesAction } from '@/services/message/actions'
import { MESSAGES_PAGE_SIZE } from '@/services/message/constants'
import type { GetMessagesDto } from '@/services/message'
import { findOldestMessage } from '@/hooks/chat/reconcile'

type Dto = GetMessagesDto[number]

interface UseOlderMessagesProps {
  channelId: string
  // Messages PERSISTÉS du cache : le curseur ne vient jamais de l'outbox ni du temps réel
  // (leurs dates sont celles du client et ils ne sont pas forcément en base).
  items: Dto[]
  updateItems: (updater: (items: Dto[]) => Dto[]) => void
}

/** Chargement de l'historique par curseur (createdAt, id), injecté dans le cache principal. */
export function useOlderMessages({ channelId, items, updateItems }: UseOlderMessagesProps) {
  const loadingRef = useRef(false) // garde synchrone : le state arrive trop tard pour un double clic
  const [isLoadingOlder, setIsLoadingOlder] = useState(false)
  // Id du plus ancien message quand le serveur a dit « plus rien avant ».
  const [exhaustedAt, setExhaustedAt] = useState<string | null>(null)

  const oldest = useMemo(() => findOldestMessage(items), [items])

  // Dérivé : si le cache est réinitialisé par un refetch (pas de chevauchement), l'id le plus
  // ancien change et hasMore redevient vrai, sans effet de reset.
  const hasMore = items.length >= MESSAGES_PAGE_SIZE && oldest?.id !== exhaustedAt

  // Charge UNE page antérieure au curseur et l'injecte dans le cache. null si rien n'a été ajouté.
  const fetchPage = useCallback(
    async (cursor: Dto) => {
      const res = await getOlderMessagesAction({
        channelId,
        before: { createdAt: new Date(cursor.createdAt).toISOString(), id: cursor.id },
      })
      if (!('data' in res) || !res.data) {
        toast.error(('error' in res && res.error) || 'Impossible de charger les messages précédents')
        return null
      }
      const { items: older, hasMore: more } = res.data
      let applied = false as boolean
      updateItems((current) => {
        applied = current.some((m) => m.id === cursor.id) // curseur disparu : page ignorée, pas de trou
        return applied ? mergeItemsById(older, current) : current
      })
      if (!applied) return null
      if (!more) setExhaustedAt(older[0]?.id ?? cursor.id)
      return res.data
    },
    [channelId, updateItems]
  )

  // Une seule opération de chargement à la fois
  const run = useCallback(async <R>(task: () => Promise<R>, fallback: R): Promise<R> => {
    if (loadingRef.current) return fallback
    loadingRef.current = true
    setIsLoadingOlder(true)
    try {
      return await task()
    } finally {
      loadingRef.current = false
      setIsLoadingOlder(false)
    }
  }, [])

  const loadOlder = useCallback(async () => {
    if (!hasMore || !oldest) return
    await run(() => fetchPage(oldest), null)
  }, [hasMore, oldest, run, fetchPage])

  // true = le message est maintenant en cache. 5 pages au plus (250 messages) : au-delà, « trop ancien ».
  const loadUntil = useCallback(
    async (messageId: string, maxPages = 5): Promise<boolean> => {
      if (items.some((m) => m.id === messageId)) return true
      if (!hasMore || !oldest) return false
      return run(async () => {
        let cursor: Dto = oldest
        for (let page = 0; page < maxPages; page++) {
          const result = await fetchPage(cursor)
          if (!result) return false
          if (result.items.some((m) => m.id === messageId)) return true
          if (!result.hasMore || !result.items[0]) return false
          cursor = result.items[0]
        }
        return false
      }, false)
    },
    [items, hasMore, oldest, run, fetchPage]
  )

  return { hasMore, loadOlder, loadUntil, isLoadingOlder }
}

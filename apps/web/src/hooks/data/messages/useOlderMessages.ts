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

  const loadOlder = useCallback(async () => {
    if (loadingRef.current || !hasMore || !oldest) return
    loadingRef.current = true
    setIsLoadingOlder(true)

    try {
      const res = await getOlderMessagesAction({
        channelId,
        before: { createdAt: new Date(oldest.createdAt).toISOString(), id: oldest.id },
      })

      if (!('data' in res) || !res.data) {
        toast.error(('error' in res && res.error) || 'Impossible de charger les messages précédents')
        return
      }

      const { items: olderItems, hasMore: moreAvailable } = res.data
      let applied = false as boolean
      updateItems((current) => {
        // Curseur disparu (refetch avec réinitialisation entre-temps) : ajouter cette page
        // créerait un trou, on l'ignore.
        applied = current.some((m) => m.id === oldest.id)
        // Le cache courant passe en second : sa version, plus fraîche, l'emporte.
        return applied ? mergeItemsById(olderItems, current) : current
      })

      if (applied && !moreAvailable) setExhaustedAt(olderItems[0]?.id ?? oldest.id)
    } finally {
      loadingRef.current = false
      setIsLoadingOlder(false)
    }
  }, [channelId, hasMore, oldest, updateItems])

  return { hasMore, loadOlder, isLoadingOlder }
}

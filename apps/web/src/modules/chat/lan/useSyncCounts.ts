'use client'

import { useEffect, useState } from 'react'
import { useChatSync } from '@/modules/chat'

// Compteurs de tous les canaux, rechargés à chaque changement d'outbox ou d'inbox
export function useSyncCounts() {
  const sync = useChatSync()
  const [counts, setCounts] = useState({ pending: 0, failed: 0, unverified: 0 })

  useEffect(() => {
    if (!sync) return
    let cancelled = false
    void Promise.all([sync.outbox.list(), sync.inbox.list()]).then(([outbox, inbox]) => {
      if (cancelled) return
      setCounts({
        pending: outbox.filter((i) => i.status === 'pending').length,
        failed: outbox.filter((i) => i.status === 'failed').length,
        unverified: inbox.length,
      })
    })
    return () => {
      cancelled = true
    }
  }, [sync?.version, sync?.outbox, sync?.inbox])

  return counts
}


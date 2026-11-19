import { useEffect, useState } from 'react'
import type { Envelope, OutboxItem } from '@attendancy/chat'
import { useChatSync } from './ChatSyncProvider'

// modules/chat/useChatSyncState.ts : outbox et inbox du canal, rechargées à chaque changement
export function useChatSyncState(channelId: string) {
  const sync = useChatSync()
  const [state, setState] = useState<{ outbox: OutboxItem[]; inbox: Envelope[] }>({ outbox: [], inbox: [] })

  useEffect(() => {
    if (!sync) return
    let cancelled = false
    void Promise.all([sync.outbox.list(channelId), sync.inbox.list(channelId)]).then(([outbox, inbox]) => {
      if (!cancelled) setState({ outbox, inbox })
    })
    return () => {
      cancelled = true
    }
  }, [sync?.version, sync?.outbox, sync?.inbox, channelId])

  return state
}

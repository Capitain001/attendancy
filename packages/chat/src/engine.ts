import type { Inbox } from './inbox'
import type { Outbox } from './outbox'
import type { Envelope, OutboxItem, SendResult } from './types'

export type TransportStatus = 'idle' | 'connecting' | 'connected' | 'closed'

// Un transport = un moyen de joindre des pairs sans serveur (hub LAN, BLE...).
// Même enveloppe pour tous : seul le transport change.
export interface ChatTransport {
  name: string
  start(): void
  stop(): void
  status(): TransportStatus
  send(env: Envelope): Promise<void>
  onReceive(cb: (env: Envelope) => void): () => void
  onStatus(cb: (s: TransportStatus) => void): () => void
}

export type ChatSyncDeps = {
  userId: string
  userName?: string | null
  outbox: Outbox
  inbox: Inbox
  // Lève une exception si le réseau est KO (le message reste pending).
  // Retourne { error } pour un refus définitif (le message passe en failed).
  sendToServer: (item: OutboxItem) => Promise<SendResult>
  probe?: () => Promise<boolean>
  transports?: ChatTransport[]
  now?: () => Date
  newId?: () => string
  onChange?: () => void
  flushIntervalMs?: number
}

export function createChatSync(deps: ChatSyncDeps) {
  const {
    userId,
    userName = null,
    outbox,
    inbox,
    sendToServer,
    probe,
    transports = [],
    now = () => new Date(),
    newId = () => crypto.randomUUID(),
    onChange,
    flushIntervalMs = 15_000,
  } = deps

  let flushing = false
  let timer: ReturnType<typeof setInterval> | undefined
  const unsubs: (() => void)[] = []

  const toEnvelope = (i: OutboxItem): Envelope => ({
    v: 1,
    id: i.id,
    channelId: i.channelId,
    authorId: userId,
    authorName: userName,
    content: i.content,
    parentId: i.parentId,
    sentAt: i.sentAt,
  })

  async function pushTo(t: ChatTransport, items: OutboxItem[]) {
    for (const item of items) {
      try {
        await t.send(toEnvelope(item))
      } catch {
        return
      }
    }
  }

  async function send({
    channelId,
    content,
    parentId = null,
  }: {
    channelId: string
    content: string
    parentId?: string | null
  }) {
    const text = content.trim()
    if (!text) return null
    const item = await outbox.add({
      id: newId(),
      channelId,
      content: text,
      parentId,
      sentAt: now().toISOString(),
    })
    await Promise.allSettled(
      transports.filter((t) => t.status() === 'connected').map((t) => pushTo(t, [item])),
    )
    void flush()
    return item
  }

  type FlushResult = { sent: number; failed: number; offline: boolean }
  let running: Promise<FlushResult> | null = null
  let again = false

  async function pass(): Promise<FlushResult> {
    let sent = 0
    let failed = 0
    const pending = (await outbox.list()).filter((i) => i.status === 'pending')
    if (pending.length === 0) return { sent, failed, offline: false }
    if (probe && !(await probe().catch(() => false))) return { sent, failed, offline: true }
    for (const item of pending) {
      let result: SendResult
      try {
        result = await sendToServer(item)
      } catch {
        return { sent, failed, offline: true }
      }
      if ('error' in result) {
        await outbox.markFailed(item.id, result.error)
        failed++
      } else {
        await outbox.remove(item.id)
        sent++
      }
    }
    return { sent, failed, offline: false }
  }

  async function run(): Promise<FlushResult> {
    const total: FlushResult = { sent: 0, failed: 0, offline: false }
    do {
      again = false
      const r = await pass()
      total.sent += r.sent
      total.failed += r.failed
      total.offline = r.offline
      if (r.offline) break
    } while (again)
    if (total.sent || total.failed) onChange?.()
    return total
  }

  // Un seul envoi à la fois. Un appel pendant un envoi en cours rejoint la
  // même exécution, qui repasse une fois de plus pour les messages ajoutés entre-temps.
  function flush(): Promise<FlushResult> {
    if (running) {
      again = true
      return running
    }
    running = run().finally(() => {
      running = null
    })
    return running
  }

  async function receive(env: Envelope) {
    if (env.v !== 1 || !env.id || !env.channelId || !env.authorId) return
    if (typeof env.content !== 'string' || !env.content.trim()) return
    if (env.authorId === userId) return
    if (await inbox.put(env)) onChange?.()
  }

  async function resendPending(t: ChatTransport) {
    const pending = (await outbox.list()).filter((i) => i.status === 'pending')
    await pushTo(t, pending)
  }

  function start() {
    for (const t of transports) {
      unsubs.push(t.onReceive((env) => void receive(env)))
      unsubs.push(
        t.onStatus((s) => {
          if (s === 'connected') void resendPending(t)
        }),
      )
      t.start()
    }
    timer = setInterval(() => void flush(), flushIntervalMs)
  }

  function stop() {
    if (timer) clearInterval(timer)
    unsubs.splice(0).forEach((u) => u())
    transports.forEach((t) => t.stop())
  }

  return {
    send,
    flush,
    receive,
    start,
    stop,
    retry: async (id: string) => {
      await outbox.retry(id)
      return flush()
    },
    discard: (id: string) => outbox.remove(id),
    // À appeler avec les ids reçus du serveur : les copies "non vérifiées" disparaissent.
    confirm: (ids: string[]) => inbox.confirm(ids),
  }
}

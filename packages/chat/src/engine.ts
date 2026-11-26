///packages\chat\src\engine.ts
import type { Inbox } from './inbox'
import type { Outbox } from './outbox'
import type { Envelope, OutboxItem, SendResult } from './types'
import { MAX_BACKDATE_MS, MAX_CONTENT_LENGTH } from './limits'

export type TransportStatus = 'idle' | 'connecting' | 'connected' | 'closed'

// Un transport = un moyen de joindre des pairs sans serveur (hub LAN, BLE...).
// Même enveloppe pour tous : seul le transport change.
export interface ChatTransport {
  name: string
  start(): void
  stop(): void
  status(): TransportStatus
  failure?(): string | null
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
  sendTimeoutMs?: number
  // Appelé une fois par message confirmé par le serveur, après retrait de l'outbox.
  // C'est ici que l'app diffuse en temps réel et notifie. Best-effort : une erreur est ignorée.
  onSent?: (item: OutboxItem, data: unknown) => void | Promise<void>
  // Canaux acceptés depuis les pairs. Sans lui, tout canal est accepté : à fournir.
  acceptsChannel?: (channelId: string) => boolean
}

export type ChatSync = ReturnType<typeof createChatSync>

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const isUuid = (x: unknown): x is string => typeof x === 'string' && UUID.test(x)

export function createChatSync(deps: ChatSyncDeps) {
  const {
    userId,
    userName = null,
    outbox,
    inbox,
    sendToServer,
    probe,
    now = () => new Date(),
    newId = () => crypto.randomUUID(),
    onChange,
    flushIntervalMs = 15_000,
    sendTimeoutMs = 20_000,
    onSent,
    acceptsChannel,
  } = deps

  const transports = [...(deps.transports ?? [])]
  let started = false
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
    createdAt: i.createdAt,
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
      createdAt: now().toISOString(),
    })
    void Promise.allSettled(
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
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('sendToServer timeout')), sendTimeoutMs),
        )
        result = await Promise.race([sendToServer(item), timeoutPromise])
      } catch {
        return { sent, failed, offline: true }
      }
      if ('error' in result) {
        // Refus transitoire (ex. parent pas encore synchronisé) : on garde pending, jusqu'à la limite de date
        const expired = now().getTime() - Date.parse(item.createdAt) > MAX_BACKDATE_MS
        if (result.retryable && !expired) continue
        await outbox.markFailed(item.id, result.error)
        failed++
      } else {
        await outbox.remove(item.id)
        sent++
        const { data } = result
        if (onSent) void Promise.resolve().then(() => onSent(item, data)).catch(() => {})
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

  async function withFlushLock<T>(task: () => Promise<T>): Promise<T> {
    const locks = typeof navigator !== 'undefined' ? navigator.locks : undefined
    if (!locks) return task()
    return locks.request(`attendancy-chat-flush:${userId}`, () => task())
  }

  // Un seul envoi à la fois. Un appel pendant un envoi en cours rejoint la
  // même exécution, qui repasse une fois de plus pour les messages ajoutés entre-temps.
  function flush(): Promise<FlushResult> {
    if (running) {
      again = true
      return running
    }
    running = withFlushLock(run).finally(() => {
      running = null
    })
    return running
  }

  async function receive(env: Envelope) {
    if (!env || env.v !== 1) return
    if (!isUuid(env.id) || !isUuid(env.channelId)) return
    if (typeof env.authorId !== 'string' || !env.authorId || env.authorId.length > 64) return
    if (env.authorId === userId) return
    if (acceptsChannel && !acceptsChannel(env.channelId)) return
    if (typeof env.content !== 'string' || !env.content.trim()) return
    if (Array.from(env.content).length > MAX_CONTENT_LENGTH) return
    if (env.parentId != null && !isUuid(env.parentId)) return
    if (typeof env.createdAt !== 'string' || Number.isNaN(Date.parse(env.createdAt))) return

    // Reconstruit l'enveloppe : aucun champ inconnu d'un pair n'entre dans IndexedDB
    const clean: Envelope = {
      v: 1,
      id: env.id,
      channelId: env.channelId,
      authorId: env.authorId,
      authorName: typeof env.authorName === 'string' ? env.authorName.slice(0, 100) : null,
      content: env.content,
      parentId: env.parentId ?? null,
      createdAt: env.createdAt,
      sig: typeof env.sig === 'string' ? env.sig : null,
    }
    if (await inbox.put(clean)) onChange?.()
  }

  async function resendPending(t: ChatTransport) {
    const pending = (await outbox.list()).filter((i) => i.status === 'pending')
    await pushTo(t, pending)
  }

  function start() {
    if (started) return
    started = true
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
    void inbox.purge().catch(() => {})
    void flush() // envoie ce qui attendait avant la fermeture de l'app
  }

  function stop() {
    if (!started) return
    started = false
    if (timer) {
      clearInterval(timer)
      timer = undefined
    }
    unsubs.splice(0).forEach((u) => u())
    transports.forEach((t) => t.stop())
  }

  function attach(t: ChatTransport) {
    const offs = [
      t.onReceive((env) => void receive(env)),
      t.onStatus((s) => {
        if (s === 'connected') void resendPending(t)
      }),
    ]
    if (!transports.includes(t)) transports.push(t)
    if (started) t.start()
    return () => {
      offs.forEach((off) => off())
      t.stop()
      const i = transports.indexOf(t)
      if (i >= 0) transports.splice(i, 1)
    }
  }

  return {
    send,
    flush,
    receive,
    start,
    stop,
    attach,
    retry: async (id: string, change?: { parentId: string | null }) => {
      await outbox.retry(id, change)
      return flush()
    },
    discard: (id: string) => outbox.remove(id),
    // À appeler avec les ids reçus du serveur : les copies "non vérifiées" disparaissent.
    confirm: (ids: string[]) => inbox.confirm(ids),
  }
}

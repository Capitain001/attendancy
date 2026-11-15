export type Envelope = {
  v: 1
  id: string
  channelId: string
  authorId: string
  authorName?: string | null
  content: string
  parentId?: string | null
  sentAt: string
  sig?: string | null
}

export type OutboxItem = {
  id: string
  userId: string
  channelId: string
  content: string
  parentId: string | null
  sentAt: string
  status: 'pending' | 'failed'
  error?: string
}

export type MessageStatus = 'sent' | 'unverified' | 'pending' | 'failed'

export type ChatMessage = {
  id: string
  channelId: string
  authorId: string
  authorName?: string | null
  content: string
  parentId: string | null
  createdAt: string
  status: MessageStatus
}

export type PersistedMessage = Omit<ChatMessage, 'status'>

export type SendResult = { data: unknown } | { error: string }

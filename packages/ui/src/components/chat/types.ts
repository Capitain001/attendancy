// packages/ui/src/components/chat/types.ts
//packages\ui\src\components\chat\types.ts
import type { FormEvent, ReactNode } from 'react'

export const DEFAULT_MESSAGE_MAX_LENGTH = 4000
export const DEFAULT_ANONYMOUS_NAME = 'Anonyme'

export type MessageStatus = 'pending' | 'sent' | 'failed' | 'unverified'

export type ReplyPreview = {
  id: string
  authorName: string | null
  content: string | null
  state: 'available' | 'deleted' | 'unknown'
}

export type ChatMessage = {
  id: string
  content: string
  parentId: string | null
  createdAt: string
  editedAt: string | null
  user: { id: string | null; name: string }
  isOwn: boolean
  status: MessageStatus
  replyTo: ReplyPreview | null
}

export interface MessageActions {
  onReply: (id: string) => void
  onJump: (id: string) => void
  onEdit: (id: string, content: string) => Promise<boolean>
  onDelete: (id: string) => Promise<boolean>
  onRetry: (id: string, options?: { withoutReply?: boolean }) => unknown
  onDiscard: (id: string) => unknown
}

export interface ChatThreadProps {
  title: string
  /** Emplacement avant le titre (ex. lien de retour sur mobile) */
  leading?: ReactNode
  messages: ChatMessage[]
  loading: boolean
  newMessage: string
  setNewMessage: (value: string) => void
  sendMessage: (event: FormEvent) => unknown
  replyingTo: ReplyPreview | null
  startReply: (id: string) => void
  cancelReply: () => void
  hasMore: boolean
  loadOlderMessages: () => unknown
  jumpToMessage: (id: string) => Promise<boolean>
  isLoadingOlder: boolean
  retryMessage: (id: string, options?: { withoutReply?: boolean }) => unknown
  editMessage: (id: string, content: string) => Promise<boolean>
  deleteMessage: (id: string) => Promise<boolean>
  discardMessage: (id: string) => unknown
  isConnected: boolean
  otherUsers: readonly unknown[]
  typingUsers: ReadonlyArray<{ name?: string | null }>
  isMuted: boolean
  toggleMute: () => void
  maxLength?: number
  anonymousName?: string
}

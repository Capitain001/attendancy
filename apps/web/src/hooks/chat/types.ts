// src/hooks/chat/types.ts
import type { RealtimeMessage } from './use-realtime-chat'

export type MessageStatus = 'sending' | 'sent' | 'failed' | 'unverified'

export type ReplyPreview = {
  id: string
  authorName: string | null // null = inconnu
  content: string | null // null = supprimé ou indisponible
  state: 'available' | 'deleted' | 'unknown'
}

// Message prêt à afficher : message du fil + dérivés propres à l'utilisateur courant
export type ChatMessage = RealtimeMessage & {
  isOwn: boolean
  status: MessageStatus
  replyTo: ReplyPreview | null
}


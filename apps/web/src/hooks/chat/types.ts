// src/hooks/chat/types.ts
import type { RealtimeMessage } from './use-realtime-chat'

// 'sent' = état par défaut : tout message absent de l'outbox (reçu des autres ou confirmé)
export type MessageStatus = 'sending' | 'sent' | 'failed'

// Message prêt à afficher : message du fil + dérivés propres à l'utilisateur courant
export type ChatMessage = RealtimeMessage & {
  isOwn: boolean
  status: MessageStatus
}

// Envois locaux non confirmés par le serveur. Invariant : une entrée = jamais diffusée.
export type OutboxEntry = {
  status: Exclude<MessageStatus, 'sent'>
  // Le canal est mémorisé : un retry ne doit jamais écrire dans le canal courant par erreur
  channelId: string
  content: string
  createdAt: string
  parentId: string | null
}

export type OutboxDraft = Omit<OutboxEntry, 'status'>
ma decision on garde les deuxenum , avec meme nom 

@attendancy/chat.
Remplacer ChatMessage par SyncMessage
// packages/chat/src/types.ts

// Enveloppe échangée sur le canal temps réel (format de transport)
export type Envelope = {
  v: 1
  id: string
  channelId: string
  authorId: string
  authorName?: string | null
  content: string
  parentId?: string | null
  createdAt: string
  sig?: string | null
}

// Message en attente d'envoi ou en échec, conservé localement
export type OutboxItem = {
  id: string
  userId: string
  channelId: string
  content: string
  parentId: string | null
  createdAt: string
  status: 'pending' | 'failed'
  error?: string
}

// Statut de livraison d'un message dans le flux de synchronisation.
// Volontairement dupliqué dans @attendancy/ui (le package reste sans dépendance) :
// les deux unions doivent rester identiques. Toute divergence est détectée
// à la compilation dans useChat, où le statut est assigné sans conversion.
export type MessageStatus = 'pending' | 'sent' | 'failed' | 'unverified'

// Message normalisé issu de la fusion serveur + outbox + inbox
// (distinct du ChatMessage de @attendancy/ui, qui est un type de vue)
export type SyncMessage = {
  id: string
  channelId: string
  authorId: string
  authorName?: string | null
  content: string
  parentId: string | null
  createdAt: string
  status: MessageStatus
}

// Message tel que persisté localement, sans statut de livraison
export type PersistedMessage = Omit<SyncMessage, 'status'>

export type SendResult = { data: unknown } | { error: string; retryable?: boolean }


useChat assigne status directement, sans mapping. Si quelqu'un ajoute une valeur d'un seul côté, l'assignation échoue à la compilation à cet endroit unique. Le typecheck fait office de garde-fou.

Dans useChat, aucune conversion : status: message.status suffit, et c'est cette ligne qui joue le rôle de garde-fou.
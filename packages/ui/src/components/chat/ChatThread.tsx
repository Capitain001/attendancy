// packages/ui/src/components/chat/ChatThread.tsx
'use client'

import { useCallback, useRef } from 'react'
import { cn } from '../../lib/utils'
import { typography } from '../../styles/ui'
import { chat } from '../../styles/ui/chat'
import { Composer } from './Composer'
import { MessageList } from './MessageList'
import {
  DEFAULT_ANONYMOUS_NAME,
  DEFAULT_MESSAGE_MAX_LENGTH,
  type ChatThreadProps,
} from './types'
import { useDelayedFlag } from './useDelayedFlag'
import { typingLabel } from './utils'

// À monter avec key={channelId} : un changement de canal repart d'un état vierge
// (défilement, saisie, édition en cours).
export function ChatThread({
  title,
  leading,
  messages,
  loading,
  newMessage,
  setNewMessage,
  sendMessage,
  replyingTo,
  startReply,
  cancelReply,
  hasMore,
  loadOlderMessages,
  jumpToMessage,
  isLoadingOlder,
  retryMessage,
  editMessage,
  deleteMessage,
  discardMessage,
  isConnected,
  otherUsers,
  typingUsers,
  isMuted,
  toggleMute,
  maxLength = DEFAULT_MESSAGE_MAX_LENGTH,
  anonymousName = DEFAULT_ANONYMOUS_NAME,
}: ChatThreadProps) {
  const composerRef = useRef<HTMLTextAreaElement>(null)
  const offline = useDelayedFlag(!isConnected, 2000)

  const reply = useCallback(
    (id: string) => {
      startReply(id)
      composerRef.current?.focus()
    },
    [startReply],
  )

  return (
    <section aria-label={title} className={chat.shell}>
      <header className={chat.header}>
        {leading}
        <div className="min-w-0 flex-1">
          <h1 className={cn(typography.h6, 'truncate')}>{title}</h1>
          <p className={cn(typography.xsmall, 'flex flex-wrap items-center gap-x-3 text-foreground/70')}>
            <span className="flex items-center gap-1.5">
              {/* Point plein = connecté, point creux = hors ligne : l'état ne dépend pas de la couleur */}
              <span aria-hidden className={cn(chat.dot, isConnected ? 'border-primary bg-primary' : 'border-foreground/60')} />
              {isConnected ? 'Connecté' : 'Hors ligne'}
            </span>
            {isConnected && otherUsers.length > 0 && <span>{otherUsers.length} en ligne</span>}
          </p>
        </div>

        <button
          type="button"
          onClick={toggleMute}
          aria-pressed={isMuted}
          title="Couper les notifications de ce canal"
          className={cn(typography.xsmall, chat.textButton, isMuted && 'bg-secondary text-foreground')}
        >
          Sourdine
        </button>
      </header>

      {offline && (
        <p role="status" className={cn(typography.xsmall, chat.banner)}>
          Hors ligne. Vos messages partiront dès que la connexion reviendra.
        </p>
      )}

      <MessageList
        messages={messages}
        loading={loading}
        hasMore={hasMore}
        isLoadingOlder={isLoadingOlder}
        onLoadOlder={loadOlderMessages}
        onJumpTo={jumpToMessage}
        maxLength={maxLength}
        actions={{
          onReply: reply,
          onEdit: editMessage,
          onDelete: deleteMessage,
          onRetry: retryMessage,
          onDiscard: discardMessage,
        }}
      />

      {/* Hauteur réservée : l'apparition de l'indicateur ne fait pas bouger la liste */}
      <p className={cn(typography.xsmall, 'h-5 px-4 text-foreground/70')}>
        {typingLabel(typingUsers.map((u) => u.name ?? anonymousName))}
      </p>

      <Composer
        value={newMessage}
        onChange={setNewMessage}
        onSubmit={sendMessage}
        replyingTo={replyingTo}
        onCancelReply={cancelReply}
        inputRef={composerRef}
        maxLength={maxLength}
      />
    </section>
  )
}

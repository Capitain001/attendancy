'use client'

import React, { useRef, useEffect } from 'react'
import { ArrowDown, MessageSquare, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { MessageItem } from './MessageItem'
import type { ChatMessage } from '@/hooks/chat/types'

interface MessageListProps {
  messages: ChatMessage[]
  typingUsers?: { id?: string | null; name?: string | null }[]
  hasMore?: boolean
  isLoadingOlder?: boolean
  onLoadOlder?: () => void
  onReply?: (message: ChatMessage) => void
  onRetry?: (id: string, options?: { withoutReply?: boolean }) => void
  onDiscard?: (id: string) => void
  className?: string
}

function formatDateSeparator(isoString: string): string {
  try {
    const date = new Date(isoString)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === today.toDateString()) {
      return "Aujourd'hui"
    }
    if (date.toDateString() === yesterday.toDateString()) {
      return 'Hier'
    }
    return date.toLocaleDateString([], {
      day: 'numeric',
      month: 'long',
      year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
    })
  } catch {
    return ''
  }
}

export function MessageList({
  messages,
  typingUsers = [],
  hasMore = false,
  isLoadingOlder = false,
  onLoadOlder,
  onReply,
  onRetry,
  onDiscard,
  className,
}: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [showScrollBottom, setShowScrollBottom] = React.useState(false)

  // Auto-scroll en bas à chaque nouveau message
  useEffect(() => {
    if (!showScrollBottom) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, showScrollBottom])

  // Détection du scroll manuel pour afficher le bouton "Revenir en bas"
  const handleScroll = () => {
    if (!containerRef.current) return
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current
    const isFarFromBottom = scrollHeight - scrollTop - clientHeight > 150
    setShowScrollBottom(isFarFromBottom)
  }

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  // Grouper les messages par date
  let lastDate = ''

  return (
    <div className={cn('relative flex h-full flex-col overflow-hidden', className)}>
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto overflow-x-hidden p-2 sm:p-4"
      >
        {/* Bouton charger les messages plus anciens */}
        {hasMore && (
          <div className="mb-4 flex justify-center">
            <Button
              variant="ghost"
              size="sm"
              disabled={isLoadingOlder}
              onClick={onLoadOlder}
              className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
            >
              {isLoadingOlder ? (
                <>
                  <Loader2 className="size-3 animate-spin" />
                  <span>Chargement de l'historique...</span>
                </>
              ) : (
                <span>Charger les messages précédents</span>
              )}
            </Button>
          </div>
        )}

        {/* État vide */}
        {messages.length === 0 ? (
          <div className="flex h-full min-h-[240px] flex-col items-center justify-center gap-2 text-center text-muted-foreground">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-muted/60">
              <MessageSquare className="size-6 opacity-60" />
            </div>
            <p className="text-sm font-medium text-foreground">Aucun message pour le moment</p>
            <p className="max-w-xs text-xs">
              Envoyez le premier message. Vos messages sont conservés localement même sans réseau.
            </p>
          </div>
        ) : (
          /* Liste des messages avec séparateurs de date */
          <div className="flex flex-col gap-1">
            {messages.map((message) => {
              const currentDate = formatDateSeparator(message.createdAt)
              const showSeparator = currentDate !== lastDate
              if (showSeparator) {
                lastDate = currentDate
              }

              return (
                <React.Fragment key={message.id}>
                  {showSeparator && currentDate && (
                    <div className="my-3 flex items-center justify-center">
                      <span className="rounded-full bg-muted/70 px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground select-none">
                        {currentDate}
                      </span>
                    </div>
                  )}

                  <MessageItem
                    message={message}
                    onReply={onReply}
                    onRetry={onRetry}
                    onDiscard={onDiscard}
                  />
                </React.Fragment>
              )
            })}
          </div>
        )}

        {/* Indicateur de frappe (Typing indicator) */}
        {typingUsers.length > 0 && (
          <div className="mt-2 flex items-center gap-2 px-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <span className="size-1.5 animate-bounce rounded-full bg-primary/70 [animation-delay:-0.3s]" />
              <span className="size-1.5 animate-bounce rounded-full bg-primary/70 [animation-delay:-0.15s]" />
              <span className="size-1.5 animate-bounce rounded-full bg-primary/70" />
            </div>
            <span className="italic">
              {typingUsers.map((u) => u.name || 'Un membre').join(', ')}{' '}
              {typingUsers.length > 1 ? 'écrivent...' : 'écrit...'}
            </span>
          </div>
        )}

        {/* Ancre de scroll bas */}
        <div ref={bottomRef} className="h-2" />
      </div>

      {/* Bouton flottant pour redescendre */}
      {showScrollBottom && (
        <Button
          size="icon"
          variant="secondary"
          onClick={scrollToBottom}
          className="absolute right-4 bottom-4 size-8 rounded-full shadow-md transition-all animate-in fade-in"
        >
          <ArrowDown className="size-4" />
          <span className="sr-only">Défiler vers le bas</span>
        </Button>
      )}
    </div>
  )
}

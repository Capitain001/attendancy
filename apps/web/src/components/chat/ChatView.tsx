'use client'

import React, { useState } from 'react'
import { Wifi, WifiOff, Bell, BellOff, QrCode } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { MessageList } from './MessageList'
import { ChatInput } from './ChatInput'
import { LanPairingDialog } from './LanPairingDialog'
import type { ChatMessage, ReplyPreview } from '@/hooks/chat/types'

interface ChatViewProps {
  title?: string
  subtitle?: string
  messages: ChatMessage[]
  newMessage: string
  onNewMessageChange: (val: string) => void
  onSendMessage: (e?: React.FormEvent) => void
  replyingTo?: ReplyPreview | null
  onStartReply?: (message: ChatMessage) => void
  onCancelReply?: () => void
  onRetryMessage?: (id: string, options?: { withoutReply?: boolean }) => void
  onDiscardMessage?: (id: string) => void
  typingUsers?: { id?: string | null; name?: string | null }[]
  isConnected?: boolean
  isLanConnected?: boolean
  isMuted?: boolean
  onToggleMute?: () => void
  hasMore?: boolean
  isLoadingOlder?: boolean
  onLoadOlder?: () => void
  onConnectLan?: (p: { url: string; token: string }) => void
  className?: string
}

export function ChatView({
  title = 'Canal de classe',
  subtitle = 'Échanges et entraide',
  messages,
  newMessage,
  onNewMessageChange,
  onSendMessage,
  replyingTo,
  onStartReply,
  onCancelReply,
  onRetryMessage,
  onDiscardMessage,
  typingUsers = [],
  isConnected = true,
  isLanConnected = false,
  isMuted = false,
  onToggleMute,
  hasMore = false,
  isLoadingOlder = false,
  onLoadOlder,
  onConnectLan,
  className,
}: ChatViewProps) {
  const [lanDialogOpen, setLanDialogOpen] = useState(false)

  return (
    <div
      className={cn(
        'flex h-full w-full flex-col overflow-hidden rounded-2xl border border-border/70 bg-background shadow-xs',
        className
      )}
    >
      {/* En-tête du canal */}
      <div className="flex items-center justify-between border-b border-border/60 bg-muted/30 px-4 py-3 select-none">
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-foreground">{title}</h2>

            {/* Badge de connectivité */}
            {isConnected ? (
              <Badge variant="outline" className="gap-1 border-emerald-500/30 bg-emerald-500/10 text-[10px] text-emerald-600 dark:text-emerald-400">
                <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Connecté
              </Badge>
            ) : isLanConnected ? (
              <Badge variant="outline" className="gap-1 border-amber-500/30 bg-amber-500/10 text-[10px] text-amber-600 dark:text-amber-400">
                <Wifi className="size-2.5" />
                LAN local
              </Badge>
            ) : (
              <Badge variant="outline" className="gap-1 border-muted-foreground/30 bg-muted text-[10px] text-muted-foreground">
                <WifiOff className="size-2.5" />
                Hors-ligne
              </Badge>
            )}
          </div>
          <span className="text-xs text-muted-foreground">{subtitle}</span>
        </div>

        {/* Actions en-tête */}
        <div className="flex items-center gap-1">
          {/* Bouton QR Code / Appairage LAN */}
          <Button
            size="sm"
            variant="outline"
            className="h-8 gap-1.5 px-2.5 text-xs"
            onClick={() => setLanDialogOpen(true)}
          >
            <QrCode className="size-3.5" />
            <span className="hidden sm:inline">Mode hors-ligne</span>
          </Button>

          {/* Sourdine notifications */}
          {onToggleMute && (
            <Button
              size="icon"
              variant="ghost"
              className="size-8 text-muted-foreground hover:text-foreground"
              onClick={onToggleMute}
            >
              {isMuted ? (
                <BellOff className="size-4 text-muted-foreground" />
              ) : (
                <Bell className="size-4" />
              )}
              <span className="sr-only">Notifications</span>
            </Button>
          )}
        </div>
      </div>

      {/* Fil de discussion */}
      <div className="flex-1 overflow-hidden">
        <MessageList
          messages={messages}
          typingUsers={typingUsers}
          hasMore={hasMore}
          isLoadingOlder={isLoadingOlder}
          onLoadOlder={onLoadOlder}
          onReply={onStartReply}
          onRetry={onRetryMessage}
          onDiscard={onDiscardMessage}
        />
      </div>

      {/* Zone de saisie en bas */}
      <div className="p-3 bg-background/80 backdrop-blur-xs">
        <ChatInput
          value={newMessage}
          onChange={onNewMessageChange}
          onSubmit={onSendMessage}
          replyingTo={replyingTo}
          onCancelReply={onCancelReply}
        />
      </div>

      {/* Dialogue d'appairage LAN / QR Code */}
      <LanPairingDialog
        open={lanDialogOpen}
        onOpenChange={setLanDialogOpen}
        onConnect={onConnectLan}
      />
    </div>
  )
}

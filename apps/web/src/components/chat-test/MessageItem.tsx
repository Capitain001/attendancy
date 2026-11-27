'use client'

import React from 'react'
import {
  CheckCheck,
  Clock,
  RotateCw,
  Trash2,
  Reply,
  AlertCircle,
  WifiOff,
  Copy,
  Check,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import type { ChatMessage } from '@/hooks/chat/types'

interface MessageItemProps {
  message: ChatMessage
  onReply?: (message: ChatMessage) => void
  onRetry?: (id: string, options?: { withoutReply?: boolean }) => void
  onDiscard?: (id: string) => void
  className?: string
}

function formatMessageTime(isoString: string): string {
  try {
    const date = new Date(isoString)
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  } catch {
    return ''
  }
}

function getInitials(name?: string | null): string {
  if (!name) return '?'
  return name
    .split(' ')
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export function MessageItem({
  message,
  onReply,
  onRetry,
  onDiscard,
  className,
}: MessageItemProps) {
  const [copied, setCopied] = React.useState(false)
  const isOwn = message.isOwn
  const isFailed = message.status === 'failed'
  const isSending = message.status === 'pending'
  const isUnverified = message.status === 'unverified'
  const isSent = message.status === 'sent'

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div
      className={cn(
        'group relative flex w-full gap-2 px-3 py-1.5 transition-colors hover:bg-muted/30',
        isOwn ? 'flex-row-reverse' : 'flex-row',
        className
      )}
    >
      {/* Avatar (uniquement pour les pairs) */}
      {!isOwn && (
        <Avatar className="size-8 shrink-0 select-none border border-border/50">
          <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
            {getInitials(message.user?.name)}
          </AvatarFallback>
        </Avatar>
      )}

      {/* Corps du message */}
      <div
        className={cn(
          'flex max-w-[80%] sm:max-w-[70%] flex-col',
          isOwn ? 'items-end' : 'items-start'
        )}
      >
        {/* Nom de l'expéditeur pour les pairs */}
        {!isOwn && message.user?.name && (
          <span className="mb-1 text-xs font-medium text-muted-foreground select-none">
            {message.user.name}
          </span>
        )}

        {/* Bulle principale */}
        <div
          className={cn(
            'relative rounded-2xl px-3.5 py-2 text-sm shadow-xs transition-shadow',
            isOwn
              ? 'bg-primary text-primary-foreground rounded-tr-xs'
              : 'bg-muted/80 text-foreground rounded-tl-xs dark:bg-muted',
            isFailed && 'border border-destructive/50 bg-destructive/10 text-foreground'
          )}
        >
          {/* Aperçu du parent cité (ReplyTo) */}
          {message.replyTo && (
            <div
              className={cn(
                'mb-2 flex flex-col border-l-2 py-0.5 pl-2 text-xs opacity-90',
                isOwn
                  ? 'border-primary-foreground/40 bg-primary-foreground/10 text-primary-foreground'
                  : 'border-primary/50 bg-background/50 text-muted-foreground'
              )}
            >
              <span className="font-semibold">
                {message.replyTo.authorName || 'Utilisateur'}
              </span>
              <span className="line-clamp-2 italic">
                {message.replyTo.state === 'deleted'
                  ? 'Message supprimé'
                  : message.replyTo.content || '...'}
              </span>
            </div>
          )}

          {/* Contenu textuel */}
          <p className="whitespace-pre-wrap break-words leading-relaxed">
            {message.content}
          </p>

          {/* Pied de message (Heure + Statuts) */}
          <div
            className={cn(
              'mt-1 flex items-center gap-1.5 text-[10px] select-none',
              isOwn
                ? 'justify-end text-primary-foreground/70'
                : 'justify-start text-muted-foreground'
            )}
          >
            <span>{formatMessageTime(message.createdAt)}</span>

            {/* Statut : En cours d'envoi */}
            {isSending && (
              <TooltipProvider delayDuration={200}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="flex items-center gap-1">
                      <Clock className="size-3 animate-pulse" />
                      <span className="text-[9px]">En attente</span>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <p className="text-xs">Message sauvegardé localement, synchronisation en cours...</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}

            {/* Statut : Non vérifié (Reçu via LAN de pair) */}
            {isUnverified && (
              <TooltipProvider delayDuration={200}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge
                      variant="outline"
                      className="h-4 gap-0.5 border-amber-500/30 bg-amber-500/10 px-1 py-0 text-[9px] font-medium text-amber-600 dark:text-amber-400"
                    >
                      <WifiOff className="size-2.5" />
                      Local
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <p className="text-xs">Reçu via le réseau local direct (non encore confirmé par le serveur)</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}

            {/* Statut : Confirmé serveur (pour ses propres messages) */}
            {isOwn && isSent && (
              <CheckCheck className="size-3 text-primary-foreground/90" />
            )}
          </div>
        </div>

        {/* Bloc d'alerte et actions en cas d'échec */}
        {isFailed && (
          <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs">
            <span className="flex items-center gap-1 font-medium text-destructive">
              <AlertCircle className="size-3.5" />
              Échec d'envoi
            </span>

            <Button
              size="sm"
              variant="outline"
              className="h-6 gap-1 px-2 text-[11px]"
              onClick={() => onRetry?.(message.id)}
            >
              <RotateCw className="size-3" />
              Réessayer
            </Button>

            {message.parentId && (
              <Button
                size="sm"
                variant="outline"
                className="h-6 gap-1 px-2 text-[11px]"
                onClick={() => onRetry?.(message.id, { withoutReply: true })}
              >
                Sans réponse
              </Button>
            )}

            <Button
              size="sm"
              variant="ghost"
              className="h-6 px-1.5 text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={() => onDiscard?.(message.id)}
            >
              <Trash2 className="size-3" />
              Retirer
            </Button>
          </div>
        )}
      </div>

      {/* Barre d'action au survol */}
      <div
        className={cn(
          'absolute top-2 hidden items-center gap-0.5 rounded-md border border-border/60 bg-background/95 px-1 py-0.5 shadow-xs backdrop-blur-xs group-hover:flex',
          isOwn ? 'left-6' : 'right-6'
        )}
      >
        {!isFailed && onReply && (
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  className="size-6 text-muted-foreground hover:text-foreground"
                  onClick={() => onReply(message)}
                >
                  <Reply className="size-3.5" />
                  <span className="sr-only">Répondre</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p className="text-xs">Citer ce message</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}

        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                className="size-6 text-muted-foreground hover:text-foreground"
                onClick={handleCopy}
              >
                {copied ? <Check className="size-3.5 text-green-500" /> : <Copy className="size-3.5" />}
                <span className="sr-only">Copier</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p className="text-xs">{copied ? 'Copié !' : 'Copier le texte'}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  )
}

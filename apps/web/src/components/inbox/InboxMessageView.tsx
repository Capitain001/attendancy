// src/components/inbox/InboxMessageView.tsx
'use client'

import { useEffect, useRef } from 'react'
import { ArrowLeft, Clock, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Empty, EmptyMedia, EmptyTitle, EmptyDescription } from '@/components/ui/empty'
import { useMarkInboxAsRead } from '@/hooks/inbox'
import { InvitationActionCard } from './InvitationActionCard'
import type { EnrichedInboxNotification } from './types'

interface InboxMessageViewProps {
  notification: EnrichedInboxNotification | null
  onBackMobile?: () => void
}

export function InboxMessageView({
  notification,
  onBackMobile,
}: InboxMessageViewProps) {
  const markAsReadMutation = useMarkInboxAsRead()
  const markedIdRef = useRef<string | null>(null)

  // Marquage automatique à la lecture dès que le message est affiché
  useEffect(() => {
    if (notification && !notification.read && markedIdRef.current !== notification.id) {
      markedIdRef.current = notification.id
      markAsReadMutation.mutate(notification.id)
    }
  }, [notification?.id, notification?.read, markAsReadMutation])

  if (!notification) {
    return (
      <div className="flex h-full items-center justify-center p-8 bg-card/10">
        <Empty>
          <EmptyMedia variant="icon">
            <Mail className="size-6 text-muted-foreground" />
          </EmptyMedia>
          <EmptyTitle>Sélectionnez un message</EmptyTitle>
          <EmptyDescription>
            Choisissez une notification dans la liste pour en consulter le détail.
          </EmptyDescription>
        </Empty>
      </div>
    )
  }

  const isInvitation = notification.type === 'INVITATION'
  const senderName = notification.metadata?.senderName ?? notification.metadata?.orgName ?? (isInvitation ? 'Invitation' : 'Système')
  const initial = senderName.charAt(0).toUpperCase()
  const dateFormatted = new Date(notification.createdAt).toLocaleString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <div className="flex h-full flex-col bg-background/50">
      {/* Barre d'outils mobile / desktop */}
      <div className="flex items-center justify-between border-b border-border/20 p-3.5 bg-card/20">
        <div className="flex items-center gap-2">
          {onBackMobile && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onBackMobile}
              className="md:hidden h-8 px-2 text-muted-foreground"
            >
              <ArrowLeft className="size-4 mr-1" />
              Retour
            </Button>
          )}
          <Badge variant="outline" className="text-xs font-normal">
            {isInvitation ? 'Invitation organisation' : notification.type}
          </Badge>
        </div>

        <div className="text-xs text-muted-foreground flex items-center gap-1.5">
          <Clock className="size-3.5" />
          {dateFormatted}
        </div>
      </div>

      {/* Contenu scrollable */}
      <ScrollArea className="flex-1 p-6">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Header de l'expéditeur */}
          <div className="flex items-start gap-4">
            <Avatar className="size-11 border border-border/30">
              {notification.metadata?.orgLogo && (
                <AvatarImage src={notification.metadata.orgLogo} alt={senderName} />
              )}
              <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                {initial}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <div className="flex items-baseline justify-between gap-2">
                <h2 className="text-base font-semibold text-foreground truncate">{senderName}</h2>
              </div>
              {notification.metadata?.orgName && notification.metadata.senderName && (
                <p className="text-xs text-muted-foreground">
                  Organisation : {notification.metadata.orgName}
                </p>
              )}
            </div>
          </div>

          {/* Corps textuel du message */}
          <div className="rounded-lg border border-border/20 bg-card/40 p-5 text-sm leading-relaxed text-foreground shadow-xs">
            {notification.message}
          </div>

          {/* Carte interactive pour les invitations */}
          {isInvitation && (
            <div className="pt-2">
              <InvitationActionCard notification={notification} />
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}

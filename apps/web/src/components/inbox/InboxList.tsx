// src/components/inbox/InboxList.tsx
'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import { Search, Mail, CheckCheck, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Empty, EmptyMedia, EmptyTitle, EmptyDescription } from '@/components/ui/empty'
import { useMarkAllInboxAsRead, useInboxUnreadCount } from '@/hooks/inbox'
import type { EnrichedInboxNotification } from './types'

interface InboxListProps {
  notifications: EnrichedInboxNotification[]
  selectedId: string | null
  onSelect: (id: string) => void
  isLoading?: boolean
  hasNextPage?: boolean
  isFetchingNextPage?: boolean
  onFetchNextPage?: () => void
}

export function InboxList({
  notifications,
  selectedId,
  onSelect,
  isLoading,
  hasNextPage,
  isFetchingNextPage,
  onFetchNextPage,
}: InboxListProps) {
  const [search, setSearch] = useState('')
  const { data: unreadCount = 0 } = useInboxUnreadCount()
  const markAllMutation = useMarkAllInboxAsRead()
  const sentinelRef = useRef<HTMLDivElement | null>(null)

  // Infinite scroll automatique via IntersectionObserver
  useEffect(() => {
    if (!hasNextPage || isFetchingNextPage || !onFetchNextPage) return
    const el = sentinelRef.current
    if (!el) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          onFetchNextPage()
        }
      },
      { rootMargin: '120px' }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [hasNextPage, isFetchingNextPage, onFetchNextPage])

  const handleMarkAllAsRead = async () => {
    try {
      await markAllMutation.mutateAsync()
      toast.success('Toutes les notifications ont été marquées comme lues')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erreur lors du marquage')
    }
  }

  const filtered = useMemo(() => {
    if (!search.trim()) return notifications
    const q = search.toLowerCase()
    return notifications.filter((n) => {
      const msg = n.message.toLowerCase()
      const orgName = n.metadata?.orgName?.toLowerCase() ?? ''
      const sender = n.metadata?.senderName?.toLowerCase() ?? ''
      return msg.includes(q) || orgName.includes(q) || sender.includes(q)
    })
  }, [notifications, search])

  const formatRelativeDate = (d: string | Date) => {
    const date = new Date(d)
    const now = new Date()
    const diffHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    if (diffHours < 1) return 'À l’instant'
    if (diffHours < 24) return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    if (diffHours < 48) return 'Hier'
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
  }

  return (
    <div className="flex h-full flex-col border-r border-border/40 bg-card/30">
      {/* Barre de recherche & Action groupée (Tout marquer comme lu) */}
      <div className="p-3 border-b border-border/20 flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher..."
            className="pl-9 h-9 text-sm bg-background/50 border-border/30 focus-visible:ring-1"
          />
        </div>

        <Button
          variant="outline"
          size="icon"
          className="size-9 shrink-0 border-border/30 text-muted-foreground hover:text-foreground hover:bg-muted/50"
          title="Tout marquer comme lu"
          aria-label="Tout marquer comme lu"
          disabled={unreadCount === 0 || markAllMutation.isPending}
          onClick={handleMarkAllAsRead}
        >
          {markAllMutation.isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <CheckCheck className="size-4" />
          )}
        </Button>
      </div>

      {/* Contenu liste */}
      <ScrollArea className="flex-1">
        {filtered.length === 0 ? (
          <div className="p-6">
            <Empty>
              <EmptyMedia variant="icon">
                <Mail className="size-5 text-muted-foreground" />
              </EmptyMedia>
              <EmptyTitle className="text-sm font-semibold">Aucun message</EmptyTitle>
              <EmptyDescription className="text-xs text-muted-foreground">
                {search ? 'Aucun résultat ne correspond à votre recherche.' : 'Votre boîte de réception est vide.'}
              </EmptyDescription>
            </Empty>
          </div>
        ) : (
          <div className="divide-y divide-border/20">
            {filtered.map((item) => {
              const isSelected = selectedId === item.id
              const isUnread = !item.read
              const isInvitation = item.type === 'INVITATION'
              const sender = item.metadata?.orgName ?? (isInvitation ? 'Invitation' : 'Système')
              const initial = sender.charAt(0).toUpperCase()

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelect(item.id)}
                  className={cn(
                    'w-full text-left p-3.5 transition-colors relative flex items-start gap-3 hover:bg-muted/40 cursor-pointer',
                    isSelected && 'bg-muted/70 hover:bg-muted/70',
                    isUnread && 'bg-primary/5 hover:bg-primary/10'
                  )}
                >
                  {/* Pastille non lu */}
                  {isUnread && (
                    <span className="absolute left-1.5 top-5 size-2 rounded-full bg-primary" />
                  )}

                  <Avatar className="size-9 shrink-0 border border-border/30 mt-0.5">
                    {item.metadata?.orgLogo && (
                      <AvatarImage src={item.metadata.orgLogo} alt={sender} />
                    )}
                    <AvatarFallback className={cn('text-xs font-semibold', isInvitation ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground')}>
                      {initial}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className={cn('text-xs truncate font-medium', isUnread ? 'text-foreground font-semibold' : 'text-muted-foreground')}>
                        {sender}
                      </span>
                      <span className="text-[11px] text-muted-foreground/70 shrink-0">
                        {formatRelativeDate(item.createdAt)}
                      </span>
                    </div>

                    <p className={cn('text-xs line-clamp-2', isUnread ? 'text-foreground font-medium' : 'text-muted-foreground')}>
                      {item.message}
                    </p>
                  </div>
                </button>
              )
            })}

            {/* Déclencheur du scroll infini et bouton de chargement */}
            {hasNextPage && (
              <div ref={sentinelRef} className="p-3 flex justify-center border-t border-border/20">
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={isFetchingNextPage}
                  onClick={onFetchNextPage}
                  className="w-full text-xs text-muted-foreground hover:text-foreground"
                >
                  {isFetchingNextPage ? (
                    <>
                      <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                      Chargement des messages...
                    </>
                  ) : (
                    'Charger plus de messages'
                  )}
                </Button>
              </div>
            )}
          </div>
        )}
      </ScrollArea>
    </div>
  )
}

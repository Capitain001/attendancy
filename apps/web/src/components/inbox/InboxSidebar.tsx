// src/components/inbox/InboxSidebar.tsx
'use client'

import { Mail, Inbox, Bell, ShieldAlert } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { InboxFilter } from '@/services/notification/validation'

interface InboxSidebarProps {
  currentFilter: InboxFilter
  onSelectFilter: (filter: InboxFilter) => void
  unreadCount?: number
  className?: string
}

export function InboxSidebar({
  currentFilter,
  onSelectFilter,
  unreadCount = 0,
  className,
}: InboxSidebarProps) {
  const folders: { id: InboxFilter; label: string; icon: React.ComponentType<{ className?: string }>; count?: number }[] = [
    { id: 'all', label: 'Tous les messages', icon: Inbox, count: unreadCount },
    { id: 'invitations', label: 'Invitations', icon: Mail },
    { id: 'unread', label: 'Non lus', icon: Bell, count: unreadCount },
    { id: 'system', label: 'Système', icon: ShieldAlert },
  ]

  return (
    <div className={cn('flex flex-col gap-1 p-3', className)}>
      <div className="px-3 py-2 text-xs font-semibold tracking-wider uppercase text-muted-foreground">
        Boîte de réception
      </div>

      <nav className="flex flex-col gap-1">
        {folders.map((f) => {
          const Icon = f.icon
          const isActive = currentFilter === f.id
          return (
            <Button
              key={f.id}
              variant={isActive ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => onSelectFilter(f.id)}
              className={cn(
                'w-full justify-between font-normal transition-colors text-sm h-9 px-3',
                isActive && 'font-medium bg-secondary text-secondary-foreground shadow-xs'
              )}
            >
              <div className="flex items-center gap-2.5 truncate">
                <Icon className={cn('size-4 text-muted-foreground', isActive && 'text-primary')} />
                <span className="truncate">{f.label}</span>
              </div>
              {typeof f.count === 'number' && f.count > 0 && (
                <Badge
                  variant={isActive ? 'default' : 'outline'}
                  className="size-5 p-0 flex items-center justify-center text-[10px] rounded-full"
                >
                  {f.count > 99 ? '99+' : f.count}
                </Badge>
              )}
            </Button>
          )
        })}
      </nav>
    </div>
  )
}

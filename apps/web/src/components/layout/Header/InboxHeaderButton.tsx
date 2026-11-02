'use client'

import Link from 'next/link'
import { Inbox } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useInboxUnreadCount } from '@/hooks/inbox'

export function InboxHeaderButton() {
  const { data: unreadCount = 0 } = useInboxUnreadCount()

  return (
    <Button
      asChild
      variant="outline"
      size="icon"
      className="relative rounded-full"
      aria-label="Boîte de réception"
    >
      <Link href="/inbox" title="Boîte de réception">
        <Inbox aria-hidden="true" className="size-4" />
        {unreadCount > 0 && (
          <Badge
            variant="default"
            className="absolute left-full top-0 size-5 -translate-x-1/2 -translate-y-1/2 shrink-0 p-0 inline-flex items-center justify-center leading-none rounded-full border-2 text-[10px] bg-primary text-primary-foreground select-none"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </Badge>
        )}
      </Link>
    </Button>
  )
}

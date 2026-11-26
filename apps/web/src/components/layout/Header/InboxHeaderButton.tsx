// src/components/layout/Header/InboxHeaderButton.tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { InboxButton } from '@attendancy/ui'
import { useInboxUnreadCount } from '@/hooks/inbox'

interface InboxHeaderButtonProps {
  fallbackHref: string
}

export function InboxHeaderButton({ fallbackHref }: InboxHeaderButtonProps) {
  const pathname = usePathname()
  const { data: unreadCount = 0 } = useInboxUnreadCount()

  return (
    <InboxButton
      pathname={pathname}
      fallbackHref={fallbackHref}
      unreadCount={unreadCount}
      LinkComponent={Link}
    />
  )
}

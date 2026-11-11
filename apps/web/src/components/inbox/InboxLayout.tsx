// src/components/inbox/InboxLayout.tsx
'use client'

import { useState, useMemo, useEffect } from 'react'
import { useQueryState, parseAsString, parseAsStringEnum } from 'nuqs'
import { cn } from '@/lib/utils'
import { InboxSidebar } from './InboxSidebar'
import { InboxList } from './InboxList'
import { InboxMessageView } from './InboxMessageView'
import { useInboxNotifications, useInboxUnreadCount } from '@/hooks/inbox'
import type { InboxFilter } from '@/services/notification/validation'
import type { EnrichedInboxNotification } from './types'

export function InboxLayout() {
  // Synchronisation d'état dans l'URL via nuqs
  const [filter, setFilter] = useQueryState(
    'filter',
    parseAsStringEnum<InboxFilter>(['all', 'invitations', 'unread', 'system']).withDefault('all')
  )
  const [selectedId, setSelectedId] = useQueryState('id', parseAsString.withDefault(''))

  // Données serveur paginées via React Query (Infinite Query)
  const {
    data,
    isLoading,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useInboxNotifications(filter)
  const { data: unreadCount = 0 } = useInboxUnreadCount()

  // Aplatissement des pages de notifications
  const safeNotifications = useMemo(() => {
    if (!data?.pages) return []
    return data.pages.flatMap((page) => (page.items ?? []) as unknown as EnrichedInboxNotification[])
  }, [data?.pages])

  // Notification sélectionnée
  const selectedNotification = useMemo(() => {
    if (!selectedId) return safeNotifications[0] ?? null
    return safeNotifications.find((n) => n.id === selectedId) ?? safeNotifications[0] ?? null
  }, [safeNotifications, selectedId])

  // Sur mobile, si un message est sélectionné, on bascule vers la vue détail
  const [mobileViewingDetail, setMobileViewingDetail] = useState(false)

  // Si l'utilisateur charge directement un id dans l'URL, activer la vue détail sur mobile
  useEffect(() => {
    if (selectedId) {
      setMobileViewingDetail(true)
    }
  }, [selectedId])

  const handleSelectNotification = (id: string) => {
    setSelectedId(id)
    setMobileViewingDetail(true)
  }

  const handleBackMobile = () => {
    setMobileViewingDetail(false)
  }

  return (
    <div className="flex h-[calc(100vh-3.5rem)] w-full overflow-hidden bg-background">
      {/* 1. Sidebar Dossiers Desktop (fixe à gauche) */}
      <aside className="hidden md:flex w-56 shrink-0 flex-col border-r border-border/30 bg-card/20">
        <InboxSidebar
          currentFilter={filter}
          onSelectFilter={(f) => {
            setFilter(f)
            setSelectedId(null)
          }}
          unreadCount={unreadCount}
        />
      </aside>

      {/* 2. Liste des messages avec scroll infini & action groupée */}
      <section
        className={cn(
          'w-full md:w-80 lg:w-96 shrink-0 flex-col h-full',
          mobileViewingDetail ? 'hidden md:flex' : 'flex'
        )}
      >
        {/* Sélecteur de dossier rapide sur petit écran */}
        <div className="md:hidden border-b border-border/20 p-2 bg-card/20">
          <InboxSidebar
            currentFilter={filter}
            onSelectFilter={(f) => {
              setFilter(f)
              setSelectedId(null)
            }}
            unreadCount={unreadCount}
          />
        </div>

        <InboxList
          notifications={safeNotifications}
          selectedId={selectedNotification?.id ?? null}
          onSelect={handleSelectNotification}
          isLoading={isLoading}
          hasNextPage={hasNextPage}
          isFetchingNextPage={isFetchingNextPage}
          onFetchNextPage={() => fetchNextPage()}
        />
      </section>

      {/* 3. Volet de lecture / Détail */}
      <main
        className={cn(
          'flex-1 h-full min-w-0',
          mobileViewingDetail ? 'flex flex-col' : 'hidden md:flex flex-col'
        )}
      >
        <InboxMessageView
          notification={selectedNotification}
          onBackMobile={handleBackMobile}
        />
      </main>
    </div>
  )
}

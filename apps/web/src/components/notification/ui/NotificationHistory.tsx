// components/notification/NotificationHistory.tsx
"use client"

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, Clock, Bell, Trash2 } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Skeleton } from '@/components/ui/skeleton'
import { useNotifications } from '@/hooks/notification/useNotification'

interface NotificationHistoryProps {
  preview?: boolean
}

export function NotificationHistory({ preview = false }: NotificationHistoryProps) {
  const { notifications, unread, isLoading, actions } = useNotifications()

  const displayedNotifications = preview ? notifications.slice(0, 3) : notifications

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    )
  }

  if (notifications.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>Aucune notification pour le moment</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* En-tête */}
      {!preview && (
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold">
              Notifications ({notifications.length})
            </h3>
            {unread.length > 0 && (
              <Badge variant="default" className="mt-1">
                {unread.length} non lue(s)
              </Badge>
            )}
          </div>
          {unread.length > 0 && (
            <Button
              onClick={() => actions.markAllRead()}
              disabled={actions.isMarkingAllRead}
              variant="outline"
              size="sm"
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Tout marquer comme lu
            </Button>
          )}
        </div>
      )}

      {/* Liste des notifications */}
      <div className="space-y-3">
        {displayedNotifications.map((notification) => (
          <div
            key={notification.id}
            className={`p-4 border rounded-lg transition-colors ${
              !notification.read ? 'bg-blue-50 border-blue-200' : ''
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-sm">{notification.type}</p>
                  {!notification.read && (
                    <Badge variant="default" className="h-4 px-1">
                      Nouveau
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {notification.message}
                </p>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatDistanceToNow(new Date(notification.createdAt), {
                      addSuffix: true,
                      locale: fr
                    })}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1 ml-4">
                {!notification.read && (
                  <Button
                    onClick={() => actions.markAsRead(notification.id)}
                    disabled={actions.isMarkingAsRead}
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Voir plus pour la preview */}
      {preview && notifications.length > 3 && (
        <Button variant="ghost" className="w-full" asChild>
          <a href="/notifications/history">
            Voir tout l'historique ({notifications.length} notifications)
          </a>
        </Button>
      )}
    </div>
  )
}
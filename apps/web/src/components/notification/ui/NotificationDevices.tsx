// components/notification/NotificationDevices.tsx
"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { type UserNotificationState } from '@/hooks/notification/useUserNotification'
import { Smartphone, Trash2, RefreshCw, BellOff } from 'lucide-react'

import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { cn, formatDate } from '@/lib/utils'


type NotificationDevicesActions = {
  requestPermission: () => Promise<boolean>
  subscribe: () => Promise<boolean>
  unsubscribe: () => Promise<boolean>
  unsubscribeDevice: (endpoint: string) => Promise<boolean>
  sendNotification: (message: string) => Promise<boolean>
  refreshSubscriptions: () => Promise<void>
}

export type NotificationDevicesProps = {
  state: UserNotificationState
  actions: NotificationDevicesActions
  isLoading: boolean
}

export function NotificationDevices({ state, actions, isLoading }: NotificationDevicesProps) {


  const handleUnsubscribeDevice = async (endpoint: string) => {
    const success = await actions.unsubscribeDevice(endpoint)
    if (success) {
      toast("Appareil désabonné",
        {description: "Cet appareil ne recevra plus de notifications",
      })
    }
  }

  const handleRefresh = async () => {
    await actions.refreshSubscriptions()
    toast( "Liste actualisée",
      {description: "La liste des appareils a été mise à jour",
    })
  }

  const truncateEndpoint = (endpoint: string, length = 40) => {
    if (endpoint.length <= length) return endpoint
    return endpoint.substring(0, length) + '...'
  }

  if (isLoading && !state.subscriptions) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className='max-h-full overflow-y-auto'>
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <Smartphone className="h-5 w-5" />
        Appareils connectés
        {state.subscriptions && (
          <Badge variant="secondary" className="ml-2">
            {state.subscriptions.length} appareil(s)
          </Badge>
        )}
      </CardTitle>
      <CardDescription>
        Gérer les appareils autorisés à recevoir des notifications
      </CardDescription>
    </CardHeader>
    <CardContent>
      {state.subscriptions === null ? (
        <div className="text-center py-8">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-3 text-muted-foreground" />
          <p className="text-muted-foreground">Chargement des appareils...</p>
        </div>
      ) : state.subscriptions.length === 0 ? (
        <div className="text-center py-8 space-y-3">
          <BellOff className="h-12 w-12 mx-auto text-muted-foreground/50" />
          <div>
            <p className="text-muted-foreground font-medium">Aucun appareil connecté</p>
            <p className="text-sm text-muted-foreground mt-1">
              Activez les notifications pour ajouter votre premier appareil
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {state.subscriptions.map((sub) => {
            const isCurrentDevice = state.subscription?.endpoint === sub.endpoint
            return (
              <div
                key={sub.id}
                className={cn(
                  "p-4 border rounded-lg transition-all hover:shadow-md",
                  isCurrentDevice && "border-primary border-4 bg-primary/5 ring-1 ring-primary/20"
                )}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className={cn(
                      "p-2 rounded-full",
                      isCurrentDevice ? "bg-primary/10" : "bg-muted"
                    )}>
                      <Smartphone className={cn(
                        "h-4 w-4",
                        isCurrentDevice ? "text-primary" : "text-muted-foreground"
                      )} />
                    </div>
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-sm truncate">
                          {truncateEndpoint(sub.endpoint)}
                        </p>
                        {isCurrentDevice && (
                          <Badge variant="default" className="text-xs">
                            Cet appareil
                          </Badge>
                        )}
                        <Badge variant="outline" className="text-xs">
                          Actif
                        </Badge>
                      </div>
                      
                      {sub.userAgent && (
                        <p className="text-xs text-muted-foreground truncate">
                          {sub.userAgent}
                        </p>
                      )}
                      
                      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <span>Ajouté:</span>
                          <span className="font-medium">{formatDate(sub.createdAt)}</span>
                        </span>
                        {sub.expiresAt && (
                          <span className="flex items-center gap-1">
                            <span>Expire:</span>
                            <span className="font-medium">{formatDate(sub.expiresAt)}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <Button
                    onClick={() => handleUnsubscribeDevice(sub.endpoint)}
                    disabled={isLoading}
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive hover:bg-destructive/10 flex-shrink-0 ml-2"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </CardContent>
  </Card>
  )
}
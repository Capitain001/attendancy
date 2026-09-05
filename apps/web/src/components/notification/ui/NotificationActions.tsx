// components/notification/NotificationActions.tsx
"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

import { Bell, BellOff, RefreshCw, Send } from 'lucide-react'
import { toast } from 'sonner'
import { NotificationPermissionButton } from '../NotificationButton'
import { NotificationDevicesProps } from './NotificationDevices'
import { cn } from '@/lib/utils'


export function NotificationActions({ state, actions, isLoading }: NotificationDevicesProps) {

  const handleSubscribe = async () => {
    const success = await actions.subscribe()
    if (success) {
      toast("Vous êtes maintenant abonné aux notifications")
    }
  }
  
  const handleUnsubscribe = async () => {
    const success = await actions.unsubscribe()
    if (success) {
      toast("Désabonnement réussi", {
        description: "Vous ne recevrez plus de notifications",
      })
    }
  }
  

  const handleRefresh = async () => {
    await actions.refreshSubscriptions()
    toast("Actualisation terminée", {
      description: "Les données ont été mises à jour",
    })
  }
  

  return (
    <Card>
    <CardHeader>
      <CardTitle>Subscription</CardTitle>
      <CardDescription>Gérer les abonnements aux notifications</CardDescription>
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {/* <NotificationPermissionButton /> */}

        {!state.subscription ? (
          <Button
            onClick={handleSubscribe}
            disabled={isLoading || !state.isGranted || !state.isSupported}
            className="gap-2"
          >
            {isLoading ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Bell className="h-4 w-4" />
            )}
            S'abonner
          </Button>
        ) : (
          <Button
            onClick={handleUnsubscribe}
            disabled={isLoading}
            variant="destructive"
            className="gap-2"
          >
            {isLoading ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <BellOff className="h-4 w-4" />
            )}
            Se désabonner
          </Button>
        )}

        <Button
          onClick={handleRefresh}
          disabled={isLoading}
          variant="outline"
          className="gap-2"
        >
          <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
          Actualiser
        </Button>
      </div>
    </CardContent>
  </Card>
  )
}

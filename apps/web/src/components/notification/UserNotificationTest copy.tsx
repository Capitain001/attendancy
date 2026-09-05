// src/components/notification/UserNotificationManager.tsx
"use client"

import { useState } from 'react'
import { useUserNotification } from '@/hooks/notification/useUserNotification'
import { Button } from '@/components/ui/button'
import { NotificationStatus } from './Notification-status'
import { NotificationPermissionButton } from './NotificationButton'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Bell, 
  BellOff, 
  Send, 
  RefreshCw, 
  Trash2, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  Smartphone,
  Shield,
  Wifi,
  Key,
  User
} from 'lucide-react'
import { cn, formatDate } from '@/lib/utils'
import { NotificationActions, NotificationDevices, NotificationStatusCard, MessageTest } from './ui'
import { UserNotificationTest } from './UserNotificationTest'

export function UserNotificationManager() {
  const { state, isLoading, error, actions } = useUserNotification()
  const [testMessage, setTestMessage] = useState('Bonjour ! Voici une notification de test 🔔')
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [localError, setLocalError] = useState<string | null>(null)

  const handleAction = async (action: () => Promise<boolean>, successMsg: string) => {
    setLocalError(null)
    setSuccessMessage(null)
    try {
      const success = await action()
      if (success) {
        setSuccessMessage(successMsg)
        setTimeout(() => setSuccessMessage(null), 4000)
      }
    } catch (err: any) {
      setLocalError(err.message || 'Une erreur est survenue')
    }
  }

  const handleSubscribe = async () => {
    await handleAction(actions.subscribe, '✅ Abonnement aux notifications activé !')
  }

  const handleUnsubscribe = async () => {
    await handleAction(actions.unsubscribe, '✅ Désabonnement des notifications effectué !')
  }

  const handleSendNotification = async () => {
    await handleAction(() => actions.sendNotification(testMessage), '✅ Notification de test envoyée !')
  }

  const handleUnsubscribeDevice = async (endpoint: string) => {
    await handleAction(() => actions.unsubscribeDevice(endpoint), '✅ Appareil désabonné avec succès !')
  }

  const handleRefresh = async () => {
    setLocalError(null)
    setSuccessMessage(null)
    try {
      await actions.refreshSubscriptions()
      setSuccessMessage('✅ Liste des appareils actualisée !')
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (error: any) {
      setLocalError(error.message || 'Erreur lors de l\'actualisation')
    }
  }

  const truncateEndpoint = (endpoint: string, length = 40) => {
    if (endpoint.length <= length) return endpoint
    return endpoint.substring(0, length) + '...'
  }

  const getStatusIcon = (status: boolean) => {
    return status ? 
      <CheckCircle2 className="h-4 w-4 text-green-600" /> : 
      <XCircle className="h-4 w-4 text-red-600" />
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* En-tête */}
      <div className="text-center space-y-3">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
          Gestion des Notifications
        </h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Gérez vos préférences de notifications push et vos appareils connectés
        </p>
      </div>

      {/* Messages d'état */}
      <div className="space-y-3">
        {(error || localError) && (
          <Alert variant="destructive" className="animate-in fade-in duration-300">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="font-medium">
              {error || localError}
            </AlertDescription>
          </Alert>
        )}
            {/* <NotificationStatusCard state={state} /> */}
        {successMessage && (
          <Alert className="border-green-500 bg-green-50 dark:bg-green-950 animate-in fade-in duration-300">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800 dark:text-green-200 font-medium">
              {successMessage}
            </AlertDescription>
          </Alert>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Colonne de gauche - État et Configuration */}
        <div className="lg:col-span-2 space-y-6">

          <Card className="">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-xl">
                <Shield className="h-5 w-5 text-primary" />
                État du Système
              </CardTitle>
              <CardDescription>
                Vérification de la configuration requise pour les notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
            <NotificationStatusCard state={state} />
            </CardContent>
          </Card>
          {/* Carte des appareils connectés */}
         <NotificationDevices state={state} actions={actions} isLoading={isLoading} />
        </div>

        {/* Colonne de droite - Actions */}
        <div className="space-y-6">
          {/* Carte d'abonnement */}
          <NotificationActions state={state} actions={actions} isLoading={isLoading} />

          {/* Carte de test */}
          <MessageTest
            value={testMessage}
            onChange={setTestMessage}
            onSend={handleSendNotification}
            state={state}
            isLoading={isLoading}
          />

          {/* Carte d'informations techniques */}
          <Card className="bg-muted/50">
            <CardHeader>
              <CardTitle className="text-sm">Informations techniques</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-xs font-mono">
                <div className="flex justify-between items-center py-1 border-b">
                  <span className="text-muted-foreground">Statut:</span>
                  <Badge variant={state.subscription ? "default" : "secondary"} className="text-xs">
                    {state.subscription ? 'Connecté' : 'Déconnecté'}
                  </Badge>
                </div>
                {state.subscription && (
                  <div className="pt-2">
                    <p className="text-muted-foreground mb-1">Endpoint:</p>
                    <div className="p-2 bg-background rounded border break-all text-xs">
                      {truncateEndpoint(state.subscription.endpoint, 50)}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

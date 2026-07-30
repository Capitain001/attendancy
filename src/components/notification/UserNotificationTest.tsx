// src/components/notification/UserNotificationTest.tsx
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
  Smartphone
} from 'lucide-react'
import { cn, formatDate } from '@/lib/utils'
import { NotificationStatusCard } from './ui'
import { NotificationStatusCards } from './ui/NotifStatusGrid'


export function UserNotificationTest() {
  const { state, isLoading, error, actions } = useUserNotification()
  const [testMessage, setTestMessage] = useState('Test de notification 🔔')
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [localError, setLocalError] = useState<string | null>(null)
  const handleSubscribe = async () => {
    await actions.subscribe()
  }

  const handleUnsubscribe = async () => {
    await actions.unsubscribe()
  }

  const handleSendNotification = async () => {
    await actions.sendNotification(testMessage)
  }

  const handleUnsubscribeDevice = async (endpoint: string) => {
    await actions.unsubscribeDevice(endpoint)
  }

  const handleRefresh = async () => {
    setLocalError(null)
    setSuccessMessage(null)
    try {
      await actions.refreshSubscriptions()
      setSuccessMessage('✅ Abonnements actualisés !')
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (error: any) {
      setLocalError(error.message || 'Erreur lors de l\'actualisation')
    }
  }


  const truncateEndpoint = (endpoint: string, length = 50) => {
    if (endpoint.length <= length) return endpoint
    return endpoint.substring(0, length) + '...'
  }

  return (
    <div className=" space-y-6">
      <div className="space-y-2">
        <p className="text-muted-foreground">
          Gestion des notifications push
        </p>
      </div>

      {/* Messages d'erreur et de succès */}
      {(error || localError) && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error || localError}</AlertDescription>
        </Alert>
      )}

      {successMessage && (
        <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800 dark:text-green-200">
            {successMessage}
          </AlertDescription>
        </Alert>
      )}

      {/* État du système */}
      <Card>
        <CardHeader>
          <CardTitle>État du Système</CardTitle>
          <CardDescription>Vérification des prérequis pour les notifications</CardDescription>
        </CardHeader>
        <CardContent>
          <NotificationStatus subscription={state.subscription} />
        </CardContent>
      </Card>

      {/* Informations de l'état */}
      <Card>
        <CardHeader>
          <CardTitle>État Actuel</CardTitle>
          <CardDescription>Informations sur l'état des notifications</CardDescription>
        </CardHeader>
        {/* <NotificationStatusCard /> */}
        <NotificationStatusCards isLoading={isLoading} state={state} />
        <NotificationStatusCard state={state} />
        {/* <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Support</p>
              <Badge variant={state.isSupported ? "default" : "destructive"}>
                {state.isSupported ? '✅ Supporté' : '❌ Non supporté'}
              </Badge>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Permission</p>
              <Badge 
                variant={
                  state.isGranted ? "default" : 
                  state.permission === 'denied' ? "destructive" : 
                  "secondary"
                }
              >
                {state.permission === 'granted' ? '✅ Accordée' : 
                 state.permission === 'denied' ? '❌ Refusée' : 
                 '⏳ En attente'}
              </Badge>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">HTTPS</p>
              <Badge variant={state.isHTTPS ? "default" : "destructive"}>
                {state.isHTTPS ? '✅ Valide' : '❌ Invalide'}
              </Badge>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">VAPID</p>
              <Badge variant={state.hasVAPID ? "default" : "destructive"}>
                {state.hasVAPID ? '✅ Configuré' : '❌ Manquant'}
              </Badge>
            </div>
          </div>
        </CardContent> */}
      </Card>

      {/* Actions principales */}
      <Card>
        <CardHeader>
          <CardTitle>Actions</CardTitle>
          <CardDescription>Gérer les abonnements aux notifications</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <NotificationPermissionButton />

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

      {/* Envoi de notification de test */}
      <Card>
        <CardHeader>
          <CardTitle>Test d'Envoi</CardTitle>
          <CardDescription>Envoyer une notification de test à l'utilisateur connecté</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              type="text"
              value={testMessage}
              onChange={(e) => setTestMessage(e.target.value)}
              placeholder="Message de test"
              className="flex-1"
            />
            <Button
              onClick={handleSendNotification}
              disabled={isLoading || !state.subscription || state.subscriptions?.length === 0}
              className="gap-2"
            >
              {isLoading ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Envoyer
            </Button>

          </div>
          {(!state.subscription || state.subscriptions?.length === 0) && (
            <p className="text-sm text-muted-foreground">
              ⚠️ Vous devez être abonné pour envoyer des notifications
            </p>
          )}
        </CardContent>
      </Card>

      {/* Liste des appareils abonnés */}
      <Card>
        <CardHeader>
          <CardTitle>Appareils Abonnés</CardTitle>
          <CardDescription>
            {state.subscriptions ? `${state.subscriptions.length} appareil(s) enregistré(s)` : 'Chargement...'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {state.subscriptions === null ? (
            <div className="text-center py-8 text-muted-foreground">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
              <p>Chargement des abonnements...</p>
            </div>
          ) : state.subscriptions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <BellOff className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Aucun appareil abonné</p>
            </div>
          ) : (
            <div className="space-y-3">
              {state.subscriptions.map((sub) => {
                const isCurrentDevice = state.subscription?.endpoint === sub.endpoint
                return (
                  <div
                    key={sub.id}
                    className={cn(
                      "p-4 border rounded-lg space-y-2",
                      isCurrentDevice && "border-primary bg-primary/5"
                    )}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <Smartphone className="h-5 w-5 mt-0.5 text-muted-foreground" />
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-sm">
                              {truncateEndpoint(sub.endpoint)}
                            </p>
                            {isCurrentDevice && (
                              <Badge variant="default" className="text-xs">
                                Appareil actuel
                              </Badge>
                            )}
                          </div>
                          {sub.userAgent && (
                            <p className="text-xs text-muted-foreground">
                              {sub.userAgent}
                            </p>
                          )}
                          <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                            <span>Créé: {formatDate(sub.createdAt)}</span>
                            {sub.expiresAt && (
                              <span>Expire: {formatDate(sub.expiresAt)}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <Button
                        onClick={() => handleUnsubscribeDevice(sub.endpoint)}
                        disabled={isLoading}
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
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

      {/* Informations de debug */}
      <Card>
        <CardHeader>
          <CardTitle>Informations de Debug</CardTitle>
          <CardDescription>Détails techniques pour le débogage</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm font-mono">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Abonnement navigateur:</span>
              <span>{state.subscription ? '✅ Actif' : '❌ Inactif'}</span>
            </div>
            {state.subscription && (
              <div className="text-xs text-muted-foreground break-all mt-2 p-2 bg-muted rounded">
                Endpoint: {state.subscription.endpoint}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}


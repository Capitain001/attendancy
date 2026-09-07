// src/hooks/notification/useUserNotification.ts
"use client"

import { useState, useEffect, useCallback } from 'react'
import {
  checkBrowserSupport,
  validateHTTPS,
  getCurrentPermission,
  serializeSubscription,
  requestNotificationPermission,
  getCurrentSubscription,
  registerBrowserSubscription,
  withSoftTimeout,
  withTimeout,
  type SerializedPushSubscription,
} from '@/modules/notification'
import {
  subscribeUser,
  unsubscribeUser,
  unsubscribeUserDevice,
  sendNotificationToCurrentUser,
  debugUserSubscriptions,
} from '@/services/notification'
import { NOTIFICATION_CONFIG } from '@/config/notification'

export interface UserNotificationState {
  isSupported: boolean
  permission: NotificationPermission
  isGranted: boolean
  isHTTPS: boolean
  hasVAPID: boolean
  subscription: PushSubscription | null
  subscriptions: Array<{
    id: string
    endpoint: string
    userAgent: string | null
    createdAt: Date
    expiresAt: Date | null
  }> | null
}

const INITIAL_STATE: UserNotificationState = {
  isSupported: false,
  permission: 'default',
  isGranted: false,
  isHTTPS: false,
  hasVAPID: false,
  subscription: null,
  subscriptions: null,
}

const LOG_PREFIX = '[useUserNotification]'

/** Enregistre l'abonnement côté serveur pour l'utilisateur connecté. */
async function persistSubscriptionOnServer(
  subscription: PushSubscription,
): Promise<{ success: true } | { success: false; error: string }> {
  const serialized: SerializedPushSubscription = serializeSubscription(subscription)
  const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : undefined

  const result = await withTimeout(
    subscribeUser(serialized, userAgent),
    15_000,
    "Le serveur n'a pas répondu à temps",
  )

  if ('error' in result) {
    return {
      success: false,
      error: result.error || "Erreur lors de l'enregistrement de l'abonnement",
    }
  }
  return { success: true }
}

export function useUserNotification() {
  const [state, setState] = useState<UserNotificationState>(INITIAL_STATE)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const isSupported = checkBrowserSupport()
    const permission = getCurrentPermission()
    const isHTTPS = validateHTTPS()

    setState(prev => ({
      ...prev,
      isSupported,
      permission,
      isGranted: permission === 'granted',
      isHTTPS,
      hasVAPID: !!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    }))

    if (isSupported) {
      checkSubscription()
      loadUserSubscriptions()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const checkSubscription = useCallback(async () => {
    try {
      const subscription = await getCurrentSubscription()
      setState(prev => ({ ...prev, subscription }))
    } catch (error) {
      console.error(`${LOG_PREFIX} Échec de la vérification de l'abonnement:`, error)
    }
  }, [])

  const loadUserSubscriptions = useCallback(async () => {
    try {
      const result = await debugUserSubscriptions()
      if (result.success && result.subscriptions) {
        setState(prev => ({ ...prev, subscriptions: result.subscriptions ?? null }))
      }
    } catch (error) {
      console.error(`${LOG_PREFIX} Échec du chargement des abonnements:`, error)
    }
  }, [])

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!state.isSupported) {
      setError('Navigateur non supporté')
      return false
    }

    try {
      const permission = await requestNotificationPermission()
      const isGranted = permission === 'granted'
      setState(prev => ({ ...prev, permission, isGranted }))
      setError(null)
      return isGranted
    } catch (error: any) {
      setError(error.message || 'Erreur lors de la demande de permission')
      return false
    }
  }, [state.isSupported])

  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!state.isSupported || !state.isGranted) {
      setError('Navigateur non supporté ou permission non accordée')
      return false
    }
    if (!NOTIFICATION_CONFIG.vapidPublicKey) {
      setError('Clé VAPID non configurée')
      return false
    }

    setIsLoading(true)
    setError(null)

    let subscription: PushSubscription | null = null

    try {
      subscription = await registerBrowserSubscription(NOTIFICATION_CONFIG.vapidPublicKey)

      const serverResult = await persistSubscriptionOnServer(subscription)
      if (!serverResult.success) {
        setError(serverResult.error)
        await subscription.unsubscribe().catch(() => undefined)
        return false
      }

      setState(prev => ({ ...prev, subscription }))
      await withSoftTimeout(loadUserSubscriptions(), 5_000, undefined)
      return true
    } catch (error: any) {
      console.error(`${LOG_PREFIX} Échec de l'abonnement:`, error)
      setError(error.message || "Erreur lors de l'abonnement")
      return false
    } finally {
      setIsLoading(false)
    }
  }, [state.isSupported, state.isGranted, loadUserSubscriptions])

  const unsubscribe = useCallback(async (): Promise<boolean> => {
    setIsLoading(true)
    setError(null)

    try {
      const subscription = await getCurrentSubscription()
      if (subscription) {
        await subscription.unsubscribe()
      }

      const result = await unsubscribeUser()
      if ('error' in result) {
        setError(result.error || 'Erreur lors du désabonnement')
        return false
      }

      setState(prev => ({ ...prev, subscription: null, subscriptions: [] }))
      return true
    } catch (error: any) {
      console.error(`${LOG_PREFIX} Échec du désabonnement:`, error)
      setError(error.message || 'Erreur lors du désabonnement')
      return false
    } finally {
      setIsLoading(false)
    }
  }, [])

  const unsubscribeDevice = useCallback(async (endpoint: string): Promise<boolean> => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await unsubscribeUserDevice(endpoint)
      if ('error' in result) {
        setError(result.error || "Erreur lors du désabonnement de l'appareil")
        return false
      }

      await loadUserSubscriptions()

      if (state.subscription?.endpoint === endpoint) {
        setState(prev => ({ ...prev, subscription: null }))
      }
      return true
    } catch (error: any) {
      console.error(`${LOG_PREFIX} Échec du désabonnement de l'appareil:`, error)
      setError(error.message || "Erreur lors du désabonnement de l'appareil")
      return false
    } finally {
      setIsLoading(false)
    }
  }, [state.subscription, loadUserSubscriptions])

  const sendNotification = useCallback(async (message: string): Promise<boolean> => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await sendNotificationToCurrentUser({ message })
      if (!result.success) {
        setError(result.error || "Erreur lors de l'envoi de la notification")
        return false
      }
      return true
    } catch (error: any) {
      console.error(`${LOG_PREFIX} Échec de l'envoi de la notification:`, error)
      setError(error.message || "Erreur lors de l'envoi de la notification")
      return false
    } finally {
      setIsLoading(false)
    }
  }, [])

  const refreshSubscriptions = useCallback(async () => {
    await loadUserSubscriptions()
    await checkSubscription()
  }, [loadUserSubscriptions, checkSubscription])

  return {
    state,
    isLoading,
    error,
    actions: {
      requestPermission,
      subscribe,
      unsubscribe,
      unsubscribeDevice,
      sendNotification,
      refreshSubscriptions,
    },
  }
}
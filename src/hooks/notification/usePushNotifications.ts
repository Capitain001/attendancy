//src/hooks/notification/usePushNotifications.ts
"use client"
import { useState, useEffect, useCallback } from 'react'
import { checkBrowserSupport, validateHTTPS, getCurrentPermission } from '@/services/notification/validation'
import { requestNotificationPermission } from '@/services/notification/permission'
import { subscribeToPush, unsubscribeFromPush, sendPushMessage, sendMessageToUser } from '@/services/notification/subscription'
import { getCurrentSubscription } from '@/services/notification/service-worker'

interface NotificationState {
  isSupported: boolean
  permission: NotificationPermission
  isGranted: boolean
  isHTTPS: boolean
  hasVAPID: boolean
  subscription: PushSubscription | null
}

export function usePushNotifications() {
  const [state, setState] = useState<NotificationState>({
    isSupported: false,
    permission: 'default',
    isGranted: false,
    isHTTPS: false,
    hasVAPID: false,
    subscription: null
  })

  const [isLoading, setIsLoading] = useState(false)

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
      hasVAPID: !!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
    }))

    if (isSupported) {
      checkSubscription()
    }
  }, [])

  const checkSubscription = useCallback(async () => {
    try {
      const subscription = await getCurrentSubscription()
      setState(prev => ({ ...prev, subscription }))
    } catch (error) {
      console.error('Erreur vérification abonnement:', error)
    }
  }, [])

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!state.isSupported) return false

    const permission = await requestNotificationPermission()
    const isGranted = permission === 'granted'

    setState(prev => ({ ...prev, permission, isGranted }))
    return isGranted
  }, [state.isSupported])

  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!state.isSupported || !state.isGranted) return false

    setIsLoading(true)
    try {
      const success = await subscribeToPush()
      if (success) await checkSubscription()
      return success
    } catch (error) {
      console.error('Erreur abonnement:', error)
      return false
    } finally {
      setIsLoading(false)
    }
  }, [state.isSupported, state.isGranted, checkSubscription])

  const unsubscribe = useCallback(async (): Promise<boolean> => {
    setIsLoading(true)
    try {
      const success = await unsubscribeFromPush()
      if (success) setState(prev => ({ ...prev, subscription: null }))
      return success
    } catch (error) {
      console.error('Erreur désabonnement:', error)
      return false
    } finally {
      setIsLoading(false)
    }
  }, [])

  const sendNotification = useCallback(async (message: string): Promise<boolean> => {
    return await sendPushMessage(message)
  }, [])



  return {
    state,
    isLoading,
    actions: {
      requestPermission,
      subscribe,
      unsubscribe,
      sendNotification,

    }
  }
}
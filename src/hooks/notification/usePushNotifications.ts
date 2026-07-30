//src/hooks/notification/usePushNotifications.ts
"use client"
import { useState, useEffect, useCallback } from 'react'
import { checkBrowserSupport, validateHTTPS, getCurrentPermission, urlBase64ToUint8Array, serializeSubscription } from '@/services/notification/utils'
import { requestNotificationPermission } from '@/services/notification/permission'
import { subscribeUser, unsubscribeUser, sendNotificationToUser } from '@/services/notification/user'
import { getServiceWorkerRegistration, getCurrentSubscription } from '@/services/notification/service-worker'

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
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      if (!vapidKey) return false
      const reg = await getServiceWorkerRegistration()
      const pushSub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      })
      const serialized = serializeSubscription(pushSub)
      const result = await subscribeUser(serialized, navigator.userAgent)
      if ('error' in result) {
        console.error('Erreur abonnement:', result.error)
        return false
      }
      await checkSubscription()
      return true
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
      const pushSub = await getCurrentSubscription()
      if (pushSub) await pushSub.unsubscribe()
      const result = await unsubscribeUser()
      if ('error' in result) {
        console.error('Erreur désabonnement:', result.error)
        return false
      }
      setState(prev => ({ ...prev, subscription: null }))
      return true
    } catch (error) {
      console.error('Erreur désabonnement:', error)
      return false
    } finally {
      setIsLoading(false)
    }
  }, [])

  const sendNotification = useCallback(async (message: string): Promise<boolean> => {
    const result = await sendNotificationToUser({ message })
    return result.success
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

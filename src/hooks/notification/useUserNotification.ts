// src/hooks/notification/useUserNotification.ts
"use client"

import { useState, useEffect, useCallback } from 'react'
import { checkBrowserSupport, validateHTTPS, getCurrentPermission } from '@/services/notification/utils'
import { requestNotificationPermission } from '@/services/notification/permission'
import { serializeSubscription } from '@/services/notification/utils'
import { getServiceWorkerRegistration, getCurrentSubscription } from '@/services/notification/service-worker'
import { 
  subscribeUser, 
  unsubscribeUser, 
  unsubscribeUserDevice,
  sendNotificationToUser,
  debugUserSubscriptions,
  type SerializedPushSubscription
} from '@/services/notification/user'
import { NOTIFICATION_CONFIG } from '@/config/notification'
import { urlBase64ToUint8Array } from '@/services/notification/utils'

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

export function useUserNotification() {
  const [state, setState] = useState<UserNotificationState>({
    isSupported: false,
    permission: 'default',
    isGranted: false,
    isHTTPS: false,
    hasVAPID: false,
    subscription: null,
    subscriptions: null
  })

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Initialisation et vérification de l'état
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
      loadUserSubscriptions()
    }
  }, [])

  // Vérifier l'abonnement actuel du navigateur
  const checkSubscription = useCallback(async () => {
    try {
      const subscription = await getCurrentSubscription()
      setState(prev => ({ ...prev, subscription }))
    } catch (error) {
      console.error('Erreur vérification abonnement:', error)
    }
  }, [])

  // Charger les abonnements de l'utilisateur depuis la base de données
  const loadUserSubscriptions = useCallback(async () => {
    console.log('📋 [loadUserSubscriptions] Début du chargement...')
    try {
      const result = await debugUserSubscriptions()
      console.log('📥 [loadUserSubscriptions] Résultat:', result)
      if (result.success && result.subscriptions) {
        console.log('✅ [loadUserSubscriptions] Abonnements chargés:', result.subscriptions.length)
        setState(prev => ({ ...prev, subscriptions: result.subscriptions ?? null }))
      } else {
        console.warn('⚠️ [loadUserSubscriptions] Échec ou pas d\'abonnements:', result)
      }
    } catch (error) {
      console.error('❌ [loadUserSubscriptions] Erreur:', error)
      console.error('❌ [loadUserSubscriptions] Stack:', error instanceof Error ? error.stack : 'N/A')
    }
    console.log('🏁 [loadUserSubscriptions] Fin du chargement')
  }, [])

  // Demander la permission de notification
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

  // S'abonner aux notifications push pour l'utilisateur connecté
  const subscribe = useCallback(async (): Promise<boolean> => {
    console.log('🔔 [subscribe] Début de l\'abonnement')
    
    if (!state.isSupported || !state.isGranted) {
      const errorMsg = 'Navigateur non supporté ou permission non accordée'
      console.error('❌ [subscribe]', errorMsg)
      setError(errorMsg)
      return false
    }

    setIsLoading(true)
    setError(null)
    console.log('⏳ [subscribe] Loading activé')
    
    try {
      // Vérifier que la clé VAPID est disponible
      if (!NOTIFICATION_CONFIG.vapidPublicKey) {
        throw new Error('Clé VAPID non configurée')
      }
      console.log('✅ [subscribe] Clé VAPID disponible')

      console.log('📋 [subscribe] Récupération du service worker...')
      
      // Ajouter un timeout global pour getServiceWorkerRegistration
      const registrationPromise = getServiceWorkerRegistration()
      const registrationTimeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          console.error('⏱️ [subscribe] TIMEOUT: Service worker registration a pris plus de 15s')
          reject(new Error('Timeout: Impossible de récupérer le service worker'))
        }, 15000)
      })
      
      const registration = await Promise.race([registrationPromise, registrationTimeoutPromise])
      console.log('✅ [subscribe] Service worker récupéré:', registration.scope)
      
      console.log('📋 [subscribe] Vérification de l\'abonnement existant...')
      const existingSub = await registration.pushManager.getSubscription()
      
      // Désabonner l'ancien abonnement s'il existe
      if (existingSub) {
        console.log('🔄 [subscribe] Désabonnement de l\'ancien abonnement...')
        try {
          await existingSub.unsubscribe()
          console.log('✅ [subscribe] Ancien abonnement désabonné')
        } catch (unsubError) {
          console.warn('⚠️ [subscribe] Erreur lors du désabonnement de l\'ancien abonnement:', unsubError)
        }
      } else {
        console.log('ℹ️ [subscribe] Aucun abonnement existant')
      }

      // Créer un nouvel abonnement avec timeout
      console.log('📋 [subscribe] Création du nouvel abonnement...')
      const subscribePromise = registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(NOTIFICATION_CONFIG.vapidPublicKey) as BufferSource,
      })

      // Timeout de 10 secondes pour éviter que ça reste bloqué
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          console.error('⏱️ [subscribe] TIMEOUT: L\'abonnement navigateur a pris plus de 10s')
          reject(new Error('Timeout: L\'abonnement a pris trop de temps'))
        }, 10000)
      })

      const subscription = await Promise.race([subscribePromise, timeoutPromise])
      console.log('✅ [subscribe] Abonnement navigateur créé:', subscription.endpoint.substring(0, 50) + '...')

      // Sérialiser l'abonnement
      const serializedSub: SerializedPushSubscription = serializeSubscription(subscription)
      console.log('✅ [subscribe] Abonnement sérialisé')
      
      // Obtenir le user agent
      const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : undefined
      console.log('📋 [subscribe] Envoi au serveur...', { userAgent: userAgent?.substring(0, 50) })

      // Enregistrer l'abonnement côté serveur pour l'utilisateur connecté avec timeout
      const serverPromise = subscribeUser(serializedSub, userAgent)
      const serverTimeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          console.error('⏱️ [subscribe] TIMEOUT: Le serveur a pris plus de 15s')
          reject(new Error('Timeout: Le serveur a pris trop de temps à répondre'))
        }, 15000)
      })

      const result = await Promise.race([serverPromise, serverTimeoutPromise])
      console.log('📥 [subscribe] Réponse serveur reçue:', result)

      if ('error' in result) {
        console.error('❌ [subscribe] Erreur serveur:', result.error)
        setError(result.error || 'Erreur lors de l\'enregistrement de l\'abonnement')
        // Désabonner du navigateur si l'enregistrement serveur a échoué
        try {
          console.log('🔄 [subscribe] Nettoyage: désabonnement navigateur...')
          await subscription.unsubscribe()
          console.log('✅ [subscribe] Nettoyage terminé')
        } catch (unsubError) {
          console.warn('⚠️ [subscribe] Erreur lors du désabonnement après échec:', unsubError)
        }
        return false
      }

      console.log('✅ [subscribe] Abonnement enregistré avec succès')
      
      // Mettre à jour l'état
      setState(prev => ({ ...prev, subscription }))
      console.log('📋 [subscribe] Chargement des abonnements utilisateur...')
      
      // Ajouter un timeout pour loadUserSubscriptions
      const loadPromise = loadUserSubscriptions()
      const loadTimeoutPromise = new Promise<void>((resolve) => {
        setTimeout(() => {
          console.warn('⚠️ [subscribe] Timeout chargement abonnements, continuation...')
          resolve()
        }, 5000)
      })
      
      await Promise.race([loadPromise, loadTimeoutPromise])
      console.log('✅ [subscribe] Abonnements chargés')
      
      return true
    } catch (error: any) {
      console.error('❌ [subscribe] Erreur complète:', error)
      console.error('❌ [subscribe] Stack:', error.stack)
      const errorMessage = error.message || 'Erreur lors de l\'abonnement'
      setError(errorMessage)
      return false
    } finally {
      console.log('🏁 [subscribe] Fin de l\'abonnement, désactivation du loading')
      setIsLoading(false)
    }
  }, [state.isSupported, state.isGranted, loadUserSubscriptions])

  // Se désabonner de tous les appareils
  const unsubscribe = useCallback(async (): Promise<boolean> => {
    setIsLoading(true)
    setError(null)
    
    try {
      // Désabonner du navigateur
      const subscription = await getCurrentSubscription()
      if (subscription) {
        await subscription.unsubscribe()
      }

      // Désabonner de tous les appareils côté serveur
      const result = await unsubscribeUser()

      if ('error' in result) {
        setError(result.error || 'Erreur lors du désabonnement')
        return false
      }

      // Mettre à jour l'état
      setState(prev => ({ ...prev, subscription: null, subscriptions: [] }))
      
      return true
    } catch (error: any) {
      console.error('Erreur désabonnement:', error)
      setError(error.message || 'Erreur lors du désabonnement')
      return false
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Se désabonner d'un appareil spécifique
  const unsubscribeDevice = useCallback(async (endpoint: string): Promise<boolean> => {
    setIsLoading(true)
    setError(null)
    
    try {
      const result = await unsubscribeUserDevice(endpoint)

      if ('error' in result) {
        setError(result.error || 'Erreur lors du désabonnement de l\'appareil')
        return false
      }

      // Recharger les abonnements
      await loadUserSubscriptions()
      
      // Si c'est l'abonnement actuel, le retirer de l'état
      if (state.subscription?.endpoint === endpoint) {
        setState(prev => ({ ...prev, subscription: null }))
      }
      
      return true
    } catch (error: any) {
      console.error('Erreur désabonnement appareil:', error)
      setError(error.message || 'Erreur lors du désabonnement de l\'appareil')
      return false
    } finally {
      setIsLoading(false)
    }
  }, [state.subscription, loadUserSubscriptions])

  // Envoyer une notification à l'utilisateur connecté
  const sendNotification = useCallback(async (message: string): Promise<boolean> => {
    setIsLoading(true)
    setError(null)
    
    try {
      const result = await sendNotificationToUser({ message })
      
      if (!result.success) {
        setError(result.error || 'Erreur lors de l\'envoi de la notification')
        return false
      }

      return true
    } catch (error: any) {
      console.error('Erreur envoi notification:', error)
      setError(error.message || 'Erreur lors de l\'envoi de la notification')
      return false
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Recharger les abonnements
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
      refreshSubscriptions
    }
  }
}


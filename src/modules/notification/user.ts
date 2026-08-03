// src/services/notification/user.ts
'use server'

import webpush from 'web-push'
import { 
  upsertPushSubscription, 
  findPushSubscriptionsByUserId,
  unsubscribeDevice,
  unsubscribeAllDevices,
  markSubscriptionAsExpired,
  getSubscriptionStats
} from './subscriptions/database'


import { ERRORS } from '@/config'
import { getAuthUser } from '../auth/persmission/acces'
import { createNotification, isVapidConfigured } from './action'
import { NotificationType } from '@/generated/prisma/client'
import { createUserNotification } from './database'
import { analyzeSendResults, sendNotificationPayload, sendToDevice } from './helper'
import { isError } from '@/utils/server'

webpush.setVapidDetails(
  'mailto:your-email@example.com',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
)

export interface SerializedPushSubscription {
  endpoint: string
  keys: {
    p256dh: string
    auth: string
  }
}

export async function subscribeUser(
    // userId: string,
    sub: SerializedPushSubscription,
    userAgent?: string
  ) {
    console.log('🔔 [subscribeUser] Début - Server Action')
    console.log('📋 [subscribeUser] Endpoint:', sub.endpoint.substring(0, 50) + '...')
    console.log('📋 [subscribeUser] UserAgent:', userAgent?.substring(0, 50))
    
    try {
      // Récupérer l'utilisateur côté serveur
       const user = await getAuthUser()
    
       const userId = user.id;
        
       if (!userId) {
         console.error("❌ ID utilisateur manquant");
         return { error: "ID utilisateur manquant" };
       }

     console.log('✅ [subscribeUser] UserId:', userId)
        
      // Créer ou mettre à jour l'abonnement
      console.log('📋 [subscribeUser] Appel upsertPushSubscription...')
      const result = await upsertPushSubscription({
        userId,
        endpoint: sub.endpoint,
        p256dh: sub.keys.p256dh,
        auth: sub.keys.auth,
        userAgent
      });
      console.log('📥 [subscribeUser] Résultat upsertPushSubscription:', result)
    
      if ("error" in result) {
        console.error("❌ [subscribeUser] Erreur DB:", result.error);
        return { error: result.error };
      }
    
      console.log("✅ [subscribeUser] Subscription enregistrée en base de données:", {
        endpoint: sub.endpoint.substring(0, 50) + "...",
        userId,
        hasKeys: !!(sub.keys?.p256dh && sub.keys?.auth)
      });
    
      console.log('🏁 [subscribeUser] Fin - Succès')
      return { data: result.data };
    } catch (error: any) {
      console.error("❌ [subscribeUser] Erreur complète:", error);
      console.error("❌ [subscribeUser] Stack:", error.stack);
      console.error("❌ [subscribeUser] Message:", error.message);
      return { error: error.message || ERRORS.AUTH || "Erreur lors de l'abonnement" };
    }
  }
  

export async function unsubscribeUser() {
  try {
    const user = await getAuthUser()

    const userId = user.id!
    const result = await unsubscribeAllDevices(userId)

    if ('error' in result) {
      console.error('❌ Erreur unsubscribeUser (DB):', result.error)
      return { success: false, error: result.error }
    }

    console.log('✅ Utilisateur désabonné de tous les appareils:', userId)
    return { success: true }
  } catch (error) {
    console.error('❌ Erreur unsubscribeUser:', error)
    return { success: false, error: String(error) }
  }
}

export async function unsubscribeUserDevice(endpoint: string) {
  try {
    const user = await getAuthUser()

    const userId = user.id!
    const result = await unsubscribeDevice({ userId, endpoint })

    if ('error' in result) {
      console.error('❌ Erreur unsubscribeUserDevice (DB):', result.error)
      return { success: false, error: result.error }
    }

    console.log('✅ Appareil désabonné:', { userId, endpoint: endpoint.substring(0, 50) + '...' })
    return { success: true }
  } catch (error) {
    console.error('❌ Erreur unsubscribeUserDevice:', error)
    return { success: false, error: String(error) }
  }
}



export async function sendNotificationToUser({ message }: { message: string }) {
  try {
    const user = await getAuthUser()
    const userId = user.id!

    // 1. Créer la notification persistante
    const notification = await createUserNotification({
      data: { message, type: NotificationType.GENERAL },
      userId
    })

    setImmediate(() => {

    });

    if ('error' in notification) {
      console.error('❌ Erreur création notification db:', notification.error)
      return { success: false, error: notification.error }
    }
    
    // 2. Récupérer les abonnements
    const subscriptionsResult = await findPushSubscriptionsByUserId(userId)

    if ('error' in subscriptionsResult) {
      console.error('❌ Erreur récupération abonnements:', subscriptionsResult.error)
      return { success: false, error: subscriptionsResult.error }
    }

    const subscriptions = subscriptionsResult.data
    if (!subscriptions || subscriptions.length === 0) {
      console.error('❌ Aucun abonnement trouvé pour l\'utilisateur:', userId)
      return { success: false, error: 'Aucun abonnement disponible' }
    }

    console.log(`📋 ${subscriptions.length} subscription(s) trouvée(s) pour l'utilisateur`)


    // 4. Préparer la payload
    const payload = await sendNotificationPayload({message, userId})

    // 5. Envoyer à tous les appareils
    const results = await Promise.allSettled(
      subscriptions.map(subscription => sendToDevice(subscription, payload))
    )

    // 6. Analyser les résultats
    const { successful, failed } = await analyzeSendResults(results)

    return { 
      success: successful > 0, 
      sent: successful, 
      failed,
      total: subscriptions.length,
      notificationId: notification?.data?.id  || null
    }
    
  } catch (error: any) {
    console.error('❌ Erreur sendNotificationToUser:', {
      message: error.message,
      stack: error.stack
    })
    
    return { 
      success: false, 
      error: error.message || 'Erreur inconnue'
    }
  }
}

/**
 * Envoie une notification push web à un utilisateur spécifique via son ID utilisateur
 * 
 * @param userId - L'ID de l'utilisateur destinataire
 * @param data - Les données de la notification (message, type, metadata, etc.)
 * @returns Résultat de l'envoi (success/error)
 * 
 * @example
 * ```typescript
 * const result = await sendPushNotificationToUserById('user-id-123', {
 *   message: 'Vous avez un nouveau message',
 *   type: NotificationType.MESSAGE,
 *   metadata: { chatId: 'chat-456' }
 * })
 * ```
 */
export async function sendPushNotificationToUserById(
  userId: string,
  data: {
    message: string
    type?: NotificationType
    metadata?: any
    scheduleId?: string
  }
) {
  try {
    // Vérifier la configuration VAPID
    if (!isVapidConfigured()) {
      console.error('❌ VAPID non configuré')
      return { 
        success: false, 
        error: 'VAPID non configuré. Vérifiez les variables d\'environnement.' 
      }
    }

    // Créer la notification persistante dans la base de données
    const notification = await createUserNotification({
      data: {
        message: data.message,
        type: data.type || NotificationType.GENERAL,
        metadata: data.metadata,
        scheduleId: data.scheduleId
      },
      userId
    })

    if ('error' in notification) {
      console.error('❌ Erreur création notification db:', notification.error)
      return { success: false, error: notification.error }
    }
    
    // Récupérer les abonnements push actifs de l'utilisateur
    const subscriptionsResult = await findPushSubscriptionsByUserId(userId)

    if ('error' in subscriptionsResult) {
      console.error('❌ Erreur récupération abonnements:', subscriptionsResult.error)
      return { success: false, error: subscriptionsResult.error }
    }

    const subscriptions = subscriptionsResult.data || []
    
    // Filtrer les abonnements expirés
    const activeSubscriptions = subscriptions.filter(
      sub => !sub.expiresAt || sub.expiresAt > new Date()
    )

    if (activeSubscriptions.length === 0) {
      console.warn(`⚠️ Aucun abonnement push actif pour l'utilisateur: ${userId}`)
      return { success: false, error: 'Aucun appareil abonné actif' }
    }

    // Préparer la payload de notification
    const payload = await sendNotificationPayload({message:data.message, userId, title:"CHAT"})

    // Envoyer la notification à tous les appareils
    await Promise.allSettled(
      activeSubscriptions.map(subscription => sendToDevice(subscription, payload))
    )

    console.log(`✅ Notification push envoyée à l'utilisateur ${userId}`)
    return { success: true }
    
  } catch (error: any) {
    console.error('❌ Erreur sendPushNotificationToUserById:', {
      userId,
      message: error.message,
      stack: error.stack
    })
    
    return { 
      success: false, 
      error: error.message || 'Erreur inconnue lors de l\'envoi de la notification push'
    }
  }
}



// Fonctions de debug avec la base de données
export async function debugSubscriptions() {
  try {
    const statsResult = await getSubscriptionStats()
    
    if ('error' in statsResult) {
      return {
        success: false,
        error: statsResult.error,
        vapidConfigured: isVapidConfigured()
      }
    }

    return {
      success: true,
      stats: statsResult.data,
      vapidConfigured: isVapidConfigured()
    }
  } catch (error) {
    return {
      success: false,
      error: String(error),
      vapidConfigured: isVapidConfigured()
    }
  }
}

export async function debugUserSubscriptions() {
  try {
    const user = await getAuthUser()

    const userId = user.id!
    const subscriptionsResult = await findPushSubscriptionsByUserId(userId)
    
    if ('error' in subscriptionsResult) {
      return { success: false, error: subscriptionsResult.error }
    }

    return {
      success: true,
      subscriptions: subscriptionsResult.data?.map(sub => ({
        id: sub.id,
        endpoint: sub.endpoint.substring(0, 100) + '...',
        userAgent: sub.userAgent,
        createdAt: sub.createdAt,
        expiresAt: sub.expiresAt
      })) || []
    }
  } catch (error) {
    return { success: false, error: String(error) }
  }
}
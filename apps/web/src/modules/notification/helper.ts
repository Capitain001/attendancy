// src/services/notification/push-helpers.ts
'use server'

import webpush from 'web-push'
import { markSubscriptionAsExpired } from './subscriptions/database'


// Préparer la payload de notification
export async function  sendNotificationPayload({userId,message,title}: {userId:string, message:string, title?:string}) {
  return JSON.stringify({
    title: title|| 'Notification 🔔',
    body: message,
    icon: '/icon-192x192.png',
    badge: '/icon-192x192.png',
    tag: 'notification-' + Date.now(),
    timestamp: Date.now(),
    data: { userId }
  })
}

// Envoyer une notification à un seul appareil
export async function sendToDevice(subscription: any, payload: string) {
  try {
    const pushSubscription: webpush.PushSubscription = {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: subscription.p256dh,
        auth: subscription.auth,
      },
    }

    console.log('📤 Envoi en cours à:', subscription.endpoint.substring(0, 50) + '...')
    
    const result = await webpush.sendNotification(pushSubscription, payload)
    
    console.log('✅ Notification envoyée!', {
      endpoint: subscription.endpoint.substring(0, 50) + '...',
      statusCode: result.statusCode
    })
    
    return { 
      success: true, 
      endpoint: subscription.endpoint,
      statusCode: result.statusCode,
    }
    
  } catch (error: any) {
    console.error('❌ Erreur envoi à un appareil:', {
      endpoint: subscription.endpoint.substring(0, 50) + '...',
      message: error.message,
      statusCode: error.statusCode
    })

    // Si l'abonnement est invalide (410 Gone), le marquer comme expiré
    if (error.statusCode === 410) {
      await markSubscriptionAsExpired(subscription.endpoint)
    }
    
    return { 
      success: false, 
      endpoint: subscription.endpoint,
      error: error.message || 'Erreur inconnue',
      statusCode: error.statusCode
    }
  }
}

// Analyser les résultats d'envoi
export async function analyzeSendResults(results: PromiseSettledResult<any>[]) {
  const successful = results.filter(r => 
    r.status === 'fulfilled' && r.value.success
  ).length
  const failed = results.length - successful

  console.log(`📊 Résultats envoi: ${successful} réussite(s), ${failed} échec(s)`)
  
  return { successful, failed }
}

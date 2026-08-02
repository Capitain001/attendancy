// src/services/push-subscription-service.ts
import { NOTIFICATION_CONFIG } from "@/config/notification"
import { validateEnvironment, validateBrowserSupport } from "./validation"
import { serializeSubscription, urlBase64ToUint8Array } from "./utils"
import { getServiceWorkerRegistration, getCurrentSubscription } from "./service-worker"
import { sendNotification, subscribeUser, unsubscribeUser } from "./subscriptions/action"
import { sendNotificationToUser } from "./user"

export async function subscribeToPush(): Promise<boolean> {
  validateEnvironment()
  validateBrowserSupport()

  const registration = await getServiceWorkerRegistration()
  const existingSub = await registration.pushManager.getSubscription()
  
  if (existingSub) {
    await existingSub.unsubscribe()
  }

  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(NOTIFICATION_CONFIG.vapidPublicKey!) as BufferSource,
  })

  const result = await subscribeUser(serializeSubscription(subscription))
  return result.success
}

export async function unsubscribeFromPush(): Promise<boolean> {
  const subscription = await getCurrentSubscription()
  
  if (subscription) {
    await subscription.unsubscribe()
  }

  const result = await unsubscribeUser()
  return result.success
}

export async function sendPushMessage(message: string): Promise<boolean> {
  const result = await sendNotification(message)
  return result.success
}


export async function sendMessageToUser({ message}: {message: string}): Promise<boolean> {
  const result = await sendNotificationToUser({message})
  return result.success

}
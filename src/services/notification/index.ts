// Actions utilisateur
export * from './actions/notification.queries'
export * from './actions/notification.mutations'

// Server actions push (importables depuis 'use client' via RPC)
export {
  subscribeUser,
  unsubscribeUser,
  unsubscribeUserDevice,
  sendPushNotificationToUserById,
} from './user'

// Types
export type { NotificationItem, NotificationStats, PushPayload, PushSubscriptionItem } from './types'

// Utils browser
export {
  urlBase64ToUint8Array,
  serializeSubscription,
  checkBrowserSupport,
  validateHTTPS,
  getCurrentPermission,
} from './utils'
export { requestNotificationPermission } from './permission'
export { getServiceWorkerRegistration, getCurrentSubscription } from './service-worker'

// ─── Core réutilisable (module) ───────────────────────────────────────────────
export * from '@/modules/notification'

// ─── Server actions notifications ────────────────────────────────────────────
export * from './actions/notification.queries'
export * from './actions/notification.mutations'

// ─── Server actions push ──────────────────────────────────────────────────────
export {
  subscribeUser,
  unsubscribeUser,
  unsubscribeUserDevice,
  sendPushNotificationToUserById,
  sendNotificationToCurrentUser,
  debugUserSubscriptions,
  debugPushStats,
} from './user'

// ─── Types métier ─────────────────────────────────────────────────────────────
export type {
  NotificationItem,
  NotificationStats,
  PushSubscriptionItem,
  PushSubscriptionStats,
} from './types'

// src/services/notification/index.ts
// ─── Core réutilisable (module) ───────────────────────────────────────────────
export * from '@/modules/notification'

// ─── Server actions notifications ────────────────────────────────────────────
export * from './actions'
export { notifyChannelMembersAction } from './domains/chat'

// ─── Server actions push ──────────────────────────────────────────────────────
export {
  subscribeUser,
  unsubscribeUser,
  unsubscribeUserDevice,
  sendNotificationToCurrentUser,
  debugUserSubscriptions,
} from './user'


// ─── Types métier ─────────────────────────────────────────────────────────────
export type {
  NotificationItem,
  NotificationStats,
  PushSubscriptionItem,
  PushSubscriptionStats,
} from './types'

export type {
  InboxFilter,
  GetInboxNotificationsInput,
} from './validation'

'use server'
// Ré-export direct vers les actions structurées — sans alias grâce aux noms sources corrects
export {
  getNotifications,
  getUnread,
  getUnreadCount,
  getAdminNotifications,
  getAdminUnreadNotifications,
  getAdminUserNotifications,
  getAdminUnreadCount,
  getAdminNotificationStats,
} from './actions/notification.queries'

export {
  markNotificationAsRead,
  markAllRead,
  deleteNotification,
  createAdminNotification,
  sendAdminPushNotification,
} from './actions/notification.mutations'

export { sendPushNotificationToUserById } from './user'

export async function isVapidConfigured(): Promise<boolean> {
  const { isVapidConfigured: check } = await import('./push')
  return check()
}

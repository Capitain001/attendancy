'use server'
// Ré-export centralisé des server actions — point d'entrée pour les hooks et composants.
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

export {
  subscribeUser,
  unsubscribeUser,
  unsubscribeUserDevice,
  sendPushNotificationToUserById,
  sendNotificationToCurrentUser,
} from './user'

export async function isVapidConfigured(): Promise<boolean> {
  const { isVapidConfigured: check } = await import('./push')
  return check()
}

// Ré-export vers la couche DB structurée — conservé pour compatibilité des imports existants
export type { CreateNotificationOutput as CreateNotificationData } from './validation'
export {
  createUserNotification,
  markNotificationRead,
  markAllNotificationsRead,
  removeNotification,
} from './database/notification.mutations'
export {
  getNotificationsForUser,
  getUnreadNotificationsForUser,
  getUnreadCountForUser,
  getOrganizationNotifications,
} from './database/notification.queries'

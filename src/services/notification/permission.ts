// Migration progressive — re-export vers @/modules/notification
// Consommateurs : migrer les imports vers `from '@/modules/notification'`
export {
  requestNotificationPermission,
  getPermissionStatus,
  showLocalNotification,
  showPersistentNotification,
} from '@/modules/notification'

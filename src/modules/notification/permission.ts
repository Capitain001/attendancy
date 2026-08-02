//src/services/notification/permission.ts
import { NOTIFICATION_CONFIG } from "@/config/notification"
import { getCurrentPermission } from "./validation"


export async function requestNotificationPermission(): Promise<NotificationPermission> {
  return await Notification.requestPermission()
}

export function showLocalNotification(title: string, options: NotificationOptions = {}) {
  if (getCurrentPermission() === 'granted') {
    new Notification(title, {
      icon: NOTIFICATION_CONFIG.defaultIcon,
      ...options
    })
  }
}

export async function showPersistentNotification(title: string, options: NotificationOptions = {}) {
  if (getCurrentPermission() === 'granted') {
    const registration = await navigator.serviceWorker.ready
    registration.showNotification(title, {
      icon: NOTIFICATION_CONFIG.defaultIcon,
      ...options
    })
  }
}

export function getPermissionStatus() {
  const permission = getCurrentPermission()
  return {
    permission,
    isGranted: permission === 'granted',
    isDenied: permission === 'denied'
  }
}
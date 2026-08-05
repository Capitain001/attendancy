import { NOTIFICATION_CONFIG } from '@/config/notification'
import { getCurrentPermission } from './utils'
import type { PermissionStatus } from './types'

// ─── Demande de permission ────────────────────────────────────────────────────

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'default'
  return Notification.requestPermission()
}

export function getPermissionStatus(): PermissionStatus {
  const permission = getCurrentPermission()
  return {
    permission,
    isGranted: permission === 'granted',
    isDenied:  permission === 'denied',
  }
}

// ─── Affichage local ─────────────────────────────────────────────────────────

export function showLocalNotification(title: string, options: NotificationOptions = {}) {
  if (getCurrentPermission() !== 'granted') return
  new Notification(title, { icon: NOTIFICATION_CONFIG.defaultIcon, ...options })
}

export async function showPersistentNotification(title: string, options: NotificationOptions = {}) {
  if (getCurrentPermission() !== 'granted') return
  const registration = await navigator.serviceWorker.ready
  registration.showNotification(title, { icon: NOTIFICATION_CONFIG.defaultIcon, ...options })
}

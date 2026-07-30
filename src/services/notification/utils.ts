import type { SerializedPushSubscription } from './user'

// ─── Conversions VAPID ────────────────────────────────────────────────────────

export function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)))
}

export function serializeSubscription(subscription: PushSubscription): SerializedPushSubscription {
  const json = subscription.toJSON()
  return {
    endpoint: subscription.endpoint,
    keys: {
      p256dh: json.keys?.p256dh ?? '',
      auth: json.keys?.auth ?? '',
    },
    expirationTime: subscription.expirationTime,
  }
}

// ─── Détection navigateur ─────────────────────────────────────────────────────

export function checkBrowserSupport(): boolean {
  return (
    typeof window !== 'undefined' &&
    'Notification' in window &&
    'serviceWorker' in navigator &&
    'PushManager' in window
  )
}

export function validateHTTPS(): boolean {
  return (
    typeof window === 'undefined' ||
    window.location.protocol === 'https:' ||
    window.location.hostname === 'localhost'
  )
}

export function getCurrentPermission(): NotificationPermission {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'default'
  return Notification.permission
}

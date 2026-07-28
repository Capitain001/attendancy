export function checkBrowserSupport(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window
}

export function validateHTTPS(): boolean {
  return typeof window === 'undefined' || window.location.protocol === 'https:' || window.location.hostname === 'localhost'
}

export function getCurrentPermission(): NotificationPermission {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'default'
  return Notification.permission
}

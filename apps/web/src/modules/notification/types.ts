export type SerializedPushSubscription = {
  endpoint: string
  keys: { p256dh: string; auth: string }
  expirationTime: number | null
}

export type PushPayload = {
  title: string
  body: string
  icon?: string
  badge?: string
  tag?: string
  timestamp?: number
  data?: Record<string, unknown>
}

export type SendDeviceResult = {
  success: boolean
  endpoint: string
  statusCode?: number
  error?: string
  shouldMarkExpired: boolean
}

export type PermissionStatus = {
  permission: NotificationPermission
  isGranted: boolean
  isDenied: boolean
}

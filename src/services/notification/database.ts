export interface CreateNotificationData {
  userId: string
  type: string
  content: string
  metadata?: Record<string, unknown>
}

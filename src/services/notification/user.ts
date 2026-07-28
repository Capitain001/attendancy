export type SerializedPushSubscription = {
  endpoint: string
  keys: { p256dh: string; auth: string }
  expirationTime: number | null
}

export async function subscribeUser(
  _subscription: SerializedPushSubscription,
  _userAgent?: string,
): Promise<{ data: true } | { error: string }> {
  return { error: 'Non implémenté' }
}

export async function unsubscribeUser(): Promise<{ success: boolean; error?: string }> {
  return { success: false, error: 'Non implémenté' }
}

export async function unsubscribeUserDevice(_endpoint: string): Promise<{ success: boolean; error?: string }> {
  return { success: false, error: 'Non implémenté' }
}

export async function sendNotificationToUser(_payload: { message: string }): Promise<{ success: boolean; error?: string }> {
  return { success: false, error: 'Non implémenté' }
}

export async function sendPushNotificationToUserById(_userId: string, _payload: { message: string }): Promise<{ success: boolean; error?: string }> {
  return { success: false, error: 'Non implémenté' }
}

export async function debugUserSubscriptions(): Promise<{ success: boolean; subscriptions?: Array<{ id: string; endpoint: string; userAgent: string | null; createdAt: Date; expiresAt: Date | null }> }> {
  return { success: false }
}

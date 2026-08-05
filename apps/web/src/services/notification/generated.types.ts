// ⚠ Fichier généré automatiquement — NE PAS ÉDITER À LA MAIN
// Régénérer : npx tsx scripts/generate/types/types.ts notification
// Pour surcharger un type, définissez-le dans ./types.ts (jamais écrasé).

import { getNotificationsForUser, getUnreadNotificationsForUser, getUnreadCountForUser, getOrganizationNotifications, getOrganizationUnreadNotifications, getOrganizationUserNotifications, getOrganizationUnreadCount, getOrganizationNotificationStats, getPushSubscriptionsByUserId, getActivePushSubscriptionsByUserId, findPushSubscriptionByEndpoint, countActiveDevicesForUser, hasActiveSubscriptions, getPushSubscriptionStats } from './database'

export type GetNotificationsForUserDto = Awaited<ReturnType<typeof getNotificationsForUser>>
export type GetUnreadNotificationsForUserDto = Awaited<ReturnType<typeof getUnreadNotificationsForUser>>
export type GetUnreadCountForUserDto = Awaited<ReturnType<typeof getUnreadCountForUser>>
export type GetOrganizationNotificationsDto = Awaited<ReturnType<typeof getOrganizationNotifications>>
export type GetOrganizationUnreadNotificationsDto = Awaited<ReturnType<typeof getOrganizationUnreadNotifications>>
export type GetOrganizationUserNotificationsDto = Awaited<ReturnType<typeof getOrganizationUserNotifications>>
export type GetOrganizationUnreadCountDto = Awaited<ReturnType<typeof getOrganizationUnreadCount>>
export type GetOrganizationNotificationStatsDto = Awaited<ReturnType<typeof getOrganizationNotificationStats>>
export type GetPushSubscriptionsByUserIdDto = Awaited<ReturnType<typeof getPushSubscriptionsByUserId>>
export type GetActivePushSubscriptionsByUserIdDto = Awaited<ReturnType<typeof getActivePushSubscriptionsByUserId>>
export type FindPushSubscriptionByEndpointDto = Awaited<ReturnType<typeof findPushSubscriptionByEndpoint>>
export type CountActiveDevicesForUserDto = Awaited<ReturnType<typeof countActiveDevicesForUser>>
export type HasActiveSubscriptionsDto = Awaited<ReturnType<typeof hasActiveSubscriptions>>
export type GetPushSubscriptionStatsDto = Awaited<ReturnType<typeof getPushSubscriptionStats>>

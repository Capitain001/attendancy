// ⚠ Fichier généré automatiquement — NE PAS ÉDITER À LA MAIN
// Régénérer : npx tsx scripts/generate/types/types.ts notification
// Pour surcharger un type, définissez-le dans ./types.ts (jamais écrasé).

import { createUserNotification, markNotificationRead, markAllNotificationsRead, removeNotification, checkOrgMembership, createNotificationForOrgUser, getNotificationsForUser, getUnreadNotificationsForUser, getUnreadCountForUser, getOrganizationNotifications, getOrganizationUnreadNotifications, getOrganizationUserNotifications, getOrganizationUnreadCount, getOrganizationNotificationStats, upsertPushSubscription, unsubscribeDevice, unsubscribeAllDevices, markSubscriptionExpired, cleanupExpiredSubscriptions, getPushSubscriptionsByUserId, getActivePushSubscriptionsByUserId, findPushSubscriptionByEndpoint, countActiveDevicesForUser, hasActiveSubscriptions, getPushSubscriptionStats } from './database'

export type CreateUserNotificationDto = Awaited<ReturnType<typeof createUserNotification>>
export type MarkNotificationReadDto = Awaited<ReturnType<typeof markNotificationRead>>
export type MarkAllNotificationsReadDto = Awaited<ReturnType<typeof markAllNotificationsRead>>
export type RemoveNotificationDto = Awaited<ReturnType<typeof removeNotification>>
export type CheckOrgMembershipDto = Awaited<ReturnType<typeof checkOrgMembership>>
export type CreateNotificationForOrgUserDto = Awaited<ReturnType<typeof createNotificationForOrgUser>>
export type GetNotificationsForUserDto = Awaited<ReturnType<typeof getNotificationsForUser>>
export type GetUnreadNotificationsForUserDto = Awaited<ReturnType<typeof getUnreadNotificationsForUser>>
export type GetUnreadCountForUserDto = Awaited<ReturnType<typeof getUnreadCountForUser>>
export type GetOrganizationNotificationsDto = Awaited<ReturnType<typeof getOrganizationNotifications>>
export type GetOrganizationUnreadNotificationsDto = Awaited<ReturnType<typeof getOrganizationUnreadNotifications>>
export type GetOrganizationUserNotificationsDto = Awaited<ReturnType<typeof getOrganizationUserNotifications>>
export type GetOrganizationUnreadCountDto = Awaited<ReturnType<typeof getOrganizationUnreadCount>>
export type GetOrganizationNotificationStatsDto = Awaited<ReturnType<typeof getOrganizationNotificationStats>>
export type UpsertPushSubscriptionDto = Awaited<ReturnType<typeof upsertPushSubscription>>
export type UnsubscribeDeviceDto = Awaited<ReturnType<typeof unsubscribeDevice>>
export type UnsubscribeAllDevicesDto = Awaited<ReturnType<typeof unsubscribeAllDevices>>
export type MarkSubscriptionExpiredDto = Awaited<ReturnType<typeof markSubscriptionExpired>>
export type CleanupExpiredSubscriptionsDto = Awaited<ReturnType<typeof cleanupExpiredSubscriptions>>
export type GetPushSubscriptionsByUserIdDto = Awaited<ReturnType<typeof getPushSubscriptionsByUserId>>
export type GetActivePushSubscriptionsByUserIdDto = Awaited<ReturnType<typeof getActivePushSubscriptionsByUserId>>
export type FindPushSubscriptionByEndpointDto = Awaited<ReturnType<typeof findPushSubscriptionByEndpoint>>
export type CountActiveDevicesForUserDto = Awaited<ReturnType<typeof countActiveDevicesForUser>>
export type HasActiveSubscriptionsDto = Awaited<ReturnType<typeof hasActiveSubscriptions>>
export type GetPushSubscriptionStatsDto = Awaited<ReturnType<typeof getPushSubscriptionStats>>

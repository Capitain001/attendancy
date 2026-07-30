# Service : notification

Gère les notifications in-app (`Notification`) et les abonnements Web Push VAPID (`PushSubscription`).

## Structure

| Fichier | Rôle |
|---|---|
| `database/notification.queries.ts` | `getNotificationsForUser`, `getUnreadNotificationsForUser`, `getUnreadCountForUser`, queries org-admin |
| `database/notification.mutations.ts` | `createUserNotification`, `markNotificationRead`, `markAllNotificationsRead`, `removeNotification`, `createNotificationForOrgUser` |
| `database/push.queries.ts` | `getPushSubscriptionsByUserId`, `getActivePushSubscriptionsByUserId`, `getSubscriptionStats` |
| `database/push.mutations.ts` | `upsertPushSubscription`, `unsubscribeDevice`, `unsubscribeAllDevices`, `markSubscriptionExpired`, `cleanupExpiredSubscriptions` |
| `actions/notification.queries.ts` | `getNotificationsAction`, `getUnreadNotificationsAction`, `getUnreadCountAction`, actions admin |
| `actions/notification.mutations.ts` | `markAsReadAction`, `markAllReadAction`, `removeNotificationAction`, `createAdminNotificationAction`, `sendAdminPushNotificationAction` |
| `user.ts` | `subscribeUser`, `unsubscribeUser`, `unsubscribeUserDevice`, `sendPushNotificationToUserById` — server actions avec `'use server'` (importables depuis `'use client'`) |
| `push.ts` | `isVapidConfigured`, `buildPushPayload`, `sendToDevice` — helpers VAPID (pas de `'use server'`) |
| `cache.ts` | `NOTIFICATION_GRAPH` — enregistré dans `src/cache/server/key.ts` |
| `validation.ts` | `createNotificationSchema`, `subscribeSchema` |
| `types.ts` | `NotificationItem`, `PushSubscriptionItem`, `NotificationStats`, `PushPayload` |
| `utils.ts` | `urlBase64ToUint8Array`, `serializeSubscription`, `checkBrowserSupport`, `validateHTTPS`, `getCurrentPermission` — browser-safe |
| `permission.ts` | `requestNotificationPermission` — browser-safe |
| `service-worker.ts` | `getServiceWorkerRegistration`, `getCurrentSubscription` — browser-safe |

## Modèles Prisma propriétaires

- `Notification` — `@@index([userId])` (pas de soft delete, cycle de vie par `read`)
- `PushSubscription` — `@@unique([endpoint, userId])`, `@@unique(endpoint)`

## Variables d'environnement VAPID

```
NEXT_PUBLIC_VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
VAPID_EMAIL=admin@example.com        # optionnel
```

Générer les clés : `node -e "const wp = require('web-push'); console.log(wp.generateVAPIDKeys())"`

## Invariants

- `orgId` du token uniquement — jamais du payload pour les actions admin
- `sendPushNotificationToUserById` ne requiert pas d'auth (appelée par d'autres services côté serveur)
- Abonnements expirés (410 Gone) marqués immédiatement dans `sendToDevice`
- Cache `NOTIFICATION(userId)` invalidé à chaque mutation (créer, lire, supprimer)
- `PushSubscription` non cachée (volatil, multi-device)

## Cross-service

- `services/invite/notifications.ts` → `sendPushNotificationToUserById` (fire-and-forget)
- `hooks/chat/useChat.ts` → `sendPushNotificationToUserById` (client → server action RPC)

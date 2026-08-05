# Service : notification

Gère les notifications in-app (`Notification`) et les abonnements Web Push VAPID (`PushSubscription`).

## Architecture module / service

```
@/modules/notification   ← core réutilisable (zéro Prisma, zéro auth)
@/services/notification  ← couplage métier attendancy (Prisma, auth, cache, org)
```

**Règle d'import :** toujours via barrel — jamais depuis un fichier interne.

```ts
import { ... } from '@/modules/notification'    // utilitaires, types purs, push helpers
import { ... } from '@/services/notification'   // server actions, types Prisma, cache
```

## Structure du service

| Fichier | Rôle |
|---|---|
| `database/notification.queries.ts` | Lectures avec `'use cache'` + cache tags |
| `database/notification.mutations.ts` | Créer, lire, supprimer + invalidation cache |
| `database/push.queries.ts` | Actifs, stats, findByEndpoint, countDevices |
| `database/push.mutations.ts` | Upsert, unsubscribe, markExpired, cleanup |
| `actions/notification.queries.ts` | Server actions lecture avec auth |
| `actions/notification.mutations.ts` | Server actions écriture avec auth |
| `user.ts` | Server actions push — subscribe/send (importe depuis `@/modules/notification`) |
| `cache.ts` | `NOTIFICATION_GRAPH` |
| `types.ts` | Types dérivés Prisma : `NotificationItem`, `PushSubscriptionItem`, `NotificationStats`, `PushSubscriptionStats` |
| `validation.ts` | `createNotificationSchema` avec types métier (`ABSENCE`, `COURSE_CHANGE`…) |
| `action.ts` | Ré-export `'use server'` centralisé |
| `index.ts` | Barrel : re-exporte module + service |

**Fichiers de migration (re-exports temporaires vers module) :**
`push.ts`, `utils.ts`, `permission.ts`, `service-worker.ts` → migrer les imports vers `@/modules/notification`

## Modèles Prisma propriétaires

- `Notification` — cycle de vie par `read` (pas de soft delete)
- `PushSubscription` — `@@unique([endpoint, userId])`, TTL via `PUSH_SUBSCRIPTION_DURATION`

## Variables d'environnement VAPID

```
NEXT_PUBLIC_VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
VAPID_EMAIL=admin@example.com
```

## Invariants

- `orgId` extrait du token auth UNIQUEMENT
- `sendPushNotificationToUserById` sans auth — appelable depuis d'autres services
- `sendToDevice` (module) retourne `shouldMarkExpired` — `user.ts` gère le cleanup DB
- Cache `NOTIFICATION(userId)` invalidé à chaque mutation
- Hard delete sur `Notification` — pas de `deletedAt`

## Wiring cache (`src/cache/server/key.ts`)

```ts
import { NOTIFICATION_GRAPH } from "@/services/notification/cache"
NOTIFICATION: key("notification"),   // dans CACHE
...NOTIFICATION_GRAPH,               // dans CACHE_GRAPH
```

## Cross-service

- Autres services → `sendPushNotificationToUserById(userId, { message })` (fire-and-forget)

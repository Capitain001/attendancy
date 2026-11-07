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
|---------|------|
| `action.ts` | Ré-export `'use server'` centralisé |
| `actions/notification.mutations.ts` | Server actions écriture avec auth |
| `actions/notification.queries.ts` | Server actions lecture avec auth |
| `cache.ts` | `NOTIFICATION_GRAPH` |
| `constants.ts` | Constantes dérivées des enums Prisma (`ORGANIZATION_TYPES`) |
| `database/index.ts` | Barrel interne (non exporté) |
| `database/notification.mutations.ts` | Créer, lire, supprimer + invalidation cache + création transactionnelle |
| `database/notification.queries.ts` | Lectures avec `'use cache'` + cache tags |
| `database/push.mutations.ts` | Upsert, unsubscribe, markExpired, cleanup |
| `database/push.queries.ts` | Actifs, stats, findByEndpoint, countDevices |
| `generated.types.ts` | Types générés automatiquement (DTOs de lecture) |
| `index.ts` | Barrel : re-exporte module + service |
| `permission.ts` | Fichier interne |
| `push.ts` | Fichier interne |
| `server.ts` | Point d'entrée serveur pour mutations transactionnelles (`createInvitationNotification`, `setInvitationNotificationStatus`, `createInvitationResponseNotification`) |
| `service-worker.ts` | Fichier interne |
| `types.ts` | Types dérivés Prisma : `NotificationItem`, `PushSubscriptionItem`, `NotificationStats`, `PushSubscriptionStats` |
| `user.ts` | Server actions push — subscribe/send (importe depuis `@/modules/notification`) |
| `utils.ts` | Utilitaires internes |
| `validation.ts` | `createNotificationSchema` avec types métier (`ABSENCE`, `COURSE_CHANGE`…) |
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

## Cross-service & cross-module

- Autres services (push) → `sendPushNotificationToUserById(userId, { message })` (fire-and-forget)
- Appels transactionnels externes (ex: `modules/invitation`) → importer depuis `@/services/notification/server`.
  Les fonctions reçoivent `tx: Tx` (`Prisma.TransactionClient`) et n'invalident PAS le cache (invalidation à la charge de l'appelant après commit via `invalidateEvent('NOTIFICATION_CREATED', userId)`).
  `setInvitationNotificationStatus` accepte les états `ACCEPTED`, `DECLINED` et `REVOKED`.

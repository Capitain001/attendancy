# Rapport — Fusion du service `notification`

**Date :** 2026-08-04  
**Sources analysées :**
- `V1` → `C:\PROJECTS\DEV\ULTIMATE\SAVE\29-05-2026\src\services\notification`
- `V2` → `C:\PROJECTS\PROJECT\PRODUCTIONS\save\att-02-08-26\src\services\notification`

**Destination :** `src/services/notification/` (projet principal `attendancy`)

---

## 1. Structure finale

```
src/services/notification/
├── CLAUDE.md                              — documentation du service
├── index.ts                               — exports publics
├── action.ts                              — ré-export 'use server' (point d'entrée hooks)
├── cache.ts                               — NOTIFICATION_GRAPH (invalidation PPR)
├── types.ts                               — tous les types dérivés + interfaces
├── validation.ts                          — schemas Valibot (données + subscriptions)
├── push.ts                                — helpers VAPID purs (sans 'use server')
├── user.ts                                — server actions push (subscribe / send)
├── permission.ts                          — browser-safe : permission + notifs locales
├── service-worker.ts                      — browser-safe : registration robuste + timeout
├── utils.ts                               — browser-safe : sérialisation, détection
├── database/
│   ├── notification.queries.ts            — lectures avec 'use cache' + cache tags
│   ├── notification.mutations.ts          — créer, lire, supprimer + invalidation cache
│   ├── push.queries.ts                    — actifs, stats, findByEndpoint, countDevices
│   └── push.mutations.ts                  — upsert, unsubscribe, markExpired, cleanup
└── actions/
    ├── notification.queries.ts            — server actions lecture avec auth
    └── notification.mutations.ts          — server actions écriture avec auth
```

**17 fichiers** — aucun fichier fourre-tout, chaque fichier a une responsabilité unique.

---

## 2. Décisions de fusion

### Ce qui vient de V2 (att-02-08-26) — base principale

| Élément | Justification |
|---|---|
| Structure `database/` + `actions/` séparés | Seule conforme aux conventions du projet |
| `'use cache'` + `cacheTag` + `cacheLife` dans les queries utilisateur | PPR actif (`cacheComponents: true`) |
| `cache.ts` avec `NOTIFICATION_GRAPH` | Invalidation événementielle propre |
| `validation.ts` Valibot complet | Conventions strictes (jamais Zod) |
| `types.ts` avec `Awaited<ReturnType<...>>` | Convention de typage du projet |
| Pattern `ActionResponse` : `{ data } | { error: string }` | Convention non négociable |
| `push.ts` sans `'use server'` | Helpers VAPID purs, séparation des concerns |
| `removeNotification` = hard delete | Conforme — pas de `deletedAt` sur `Notification` |
| Stats org calculées en `Promise.all` | Parallèle vs séquentiel (performance) |
| Select minimal dans les queries Prisma | Pas de `include` large — données strictement nécessaires |

### Ce qui vient de V1 (29-05-2026) — apports spécifiques

| Élément | Justification |
|---|---|
| `permission.ts` enrichi : `showLocalNotification`, `showPersistentNotification`, `getPermissionStatus` | Fonctions utiles absentes de V2 |
| `service-worker.ts` robuste : `registerServiceWorker` avec timeout 10s + fallback | V2 trop simpliste (`navigator.serviceWorker.ready` sans protection) |
| `push.queries.ts` étendu : `findPushSubscriptionByEndpoint`, `countActiveDevicesForUser`, `hasActiveSubscriptions` | Fonctions absentes de V2 mais utiles pour des vérifications rapides |
| `PUSH_SUBSCRIPTION_DURATION` depuis `@/config/notification` | Centralisé et configurable (V2 hardcodait 90 jours) |

### Ce qui a été écarté des deux versions

| Élément écarté | Version | Raison |
|---|---|---|
| `subscriptions/action.ts` — stockage `Map` en mémoire | V1 | Prototype non persistant — perdu au redémarrage |
| `console.log` de debug omniprésents | V1 | Bruit en production, pollue les logs |
| `'use server'` dans `database.ts` | V1 | Violation de convention |
| `"use client"` dans `utils.ts` | V1 | Incorrect — fonctions pures, pas de hooks |
| JSDoc multi-paragraphes | V1 | Convention du projet : pas de commentaires évidents |
| Alias `debugUserSubscriptions` / `V1` commentaires | V2 | Code legacy, nettoyé |

---

## 3. Corrections TS appliquées lors de l'intégration

| Erreur | Fichier | Correction |
|---|---|---|
| `prisma` introuvable | 4 fichiers `database/` | `@/utils/server/prisma` → `@/lib/prisma` |
| `getUserInfo` introuvable | `actions/` + `user.ts` | `@/services/user/userInfo` → `@/modules/user/userInfo` |
| `getAuthorization` introuvable | `actions/` | `@/services/auth/authorization` → `@/modules/auth` |
| Prisma direct dans `actions/` | `actions/notification.mutations.ts` | Extrait en `checkOrgMembership()` dans `database/notification.mutations.ts` |
| `reduce` implicit `any` | `database/notification.queries.ts` | `byTypeMap` typé hors du `Promise.all` |
| Import circulaire latent | `utils.ts → user.ts` | `SerializedPushSubscription` déplacé dans `types.ts` |
| `subscribeSchema` non utilisé | `user.ts` | Validation Valibot ajoutée dans `subscribeUser` |
| Hook cassé `useUserNotification.ts` | `hooks/notification/` | Imports redirigés de `@/modules/notification/*` → `@/services/notification/*` |

**Résultat :** 0 erreur TS liée au service notification après corrections.

---

## 4. Améliorations appliquées (hors correction d'erreurs)

Ces points ont été identifiés pendant l'analyse et corrigés dans la foulée :

1. **`SerializedPushSubscription` dans `types.ts`** — évite que `utils.ts` (browser-safe) importe depuis `user.ts` (server action).
2. **Validation Valibot dans `subscribeUser`** — l'endpoint venant du navigateur est une frontière système → validation obligatoire.
3. **`checkOrgMembership` dans `database/`** — Prisma hors de `actions/`, conforme aux conventions.

---

## 5. Décisions à prendre

Ces points ont été identifiés mais **non implémentés** — ils nécessitent une décision produit ou une discussion technique.

### 5.1 `sendToDevice` a un side-effect DB

**Situation actuelle :** `push.ts` se présente comme helper pur mais appelle `markSubscriptionExpired` (couche DB) quand un abonnement retourne 410.

**Option A — Garder tel quel** : couplage invisible mais ça fonctionne.  
**Option B — Retourner un flag** :
```ts
return { success: false, shouldMarkExpired: err.statusCode === 410, ... }
// user.ts gère le side-effect
if (result.shouldMarkExpired) markSubscriptionExpired(result.endpoint).catch(() => {})
```
→ `push.ts` devient réellement pur, testable sans mock DB.

**Recommandation :** Option B si les tests unitaires de `push.ts` deviennent nécessaires.

---

### 5.2 Notification persistée même si push non délivré

**Situation actuelle :** `sendPushNotificationToUserById` crée toujours la notification en base, puis retourne `error` si aucun appareil actif.

**Option A — Comportement actuel** : audit trail complet, notification visible dans le centre de notifs même sans push.  
**Option B — Créer seulement si envoi réussi** : risque de perte de données si l'envoi échoue à mi-chemin.  
**Option C — Flag `persistOnly`** : laisser l'appelant choisir le comportement.

**Recommandation :** Option A est le bon comportement par défaut (les notifs in-app et push sont deux canaux distincts).

---

### 5.3 Retour de `sendPushNotificationToUserById` appauvri

**Situation actuelle :**
```ts
return { success: boolean; error?: string }
```
**Proposition :**
```ts
return { success: boolean; sent: number; failed: number; total: number; error?: string }
```
→ Utile pour les actions admin qui veulent afficher des stats d'envoi.

**Impact :** casse les appelants existants qui ne vérifient que `result.success`.

---

### 5.4 Cleanup des abonnements expirés

**Situation actuelle :** `cleanupExpiredSubscriptions()` existe dans `database/push.mutations.ts` mais n'est jamais appelé.

**Options :**
- Route `GET /api/cron/cleanup-push` protégée par `CRON_SECRET` (Vercel Cron)
- Appel opportuniste dans `upsertPushSubscription` (nettoyage à chaque nouvel abonnement)
- Job externe (si infrastructure cron disponible)

**Impact estimé :** sans cleanup, la table `PushSubscription` grossit indéfiniment. À 1 000 utilisateurs actifs sur 3 appareils chacun → ~3 000 lignes/an max (faible, mais à anticiper).

---

### 5.5 `metadata` et `scheduleId` absents du payload push

**Situation actuelle :** ces champs sont persistés en base mais pas transmis au service worker dans le payload JSON.

**Conséquence :** le service worker ne peut pas naviguer vers la bonne page au clic (ex : `/schedule/123`) sans cet identifiant.

**Correction simple :**
```ts
// push.ts — buildPushPayload
data: {
  userId: params.userId,
  scheduleId: params.scheduleId,   // → navigation ciblée
  metadata: params.metadata,
}
```
**Impact :** nécessite que le service worker (`public/sw.js`) lise `event.notification.data.scheduleId`.

---

### 5.6 Wiring cache — à activer

**Situation :** le `NOTIFICATION_GRAPH` a été ajouté dans `src/cache/server/key.ts` lors de la création. Il était commenté — il est maintenant **actif**.

**Vérifier** que les events `NOTIFICATION_CREATED`, `NOTIFICATION_READ`, `NOTIFICATION_ALL_READ`, `NOTIFICATION_REMOVED` sont bien propagés dans le moteur d'invalidation (`createInvalidators`).

---

## 6. Points de ré-utilisation (autres projets)

Le service est conçu pour être portable. Pour l'adapter à un autre projet avec les mêmes patterns :

1. **Variables d'environnement VAPID** — identiques partout :
   ```
   NEXT_PUBLIC_VAPID_PUBLIC_KEY=...
   VAPID_PRIVATE_KEY=...
   VAPID_EMAIL=admin@example.com
   ```

2. **Config à adapter** (`src/config/notification.ts`) :
   - `serviceWorkerPath` — chemin vers le SW
   - `defaultIcon` — icône de notification
   - `PUSH_SUBSCRIPTION_DURATION` — TTL abonnements

3. **Cache à brancher** (`src/cache/server/key.ts`) :
   ```ts
   import { NOTIFICATION_GRAPH } from "@/services/notification/cache"
   NOTIFICATION: key("notification"),          // dans CACHE
   ...NOTIFICATION_GRAPH,                      // dans CACHE_GRAPH
   ```

4. **Modèles Prisma requis** : `Notification` + `PushSubscription` avec les champs attendus.

5. **Auth** : remplacer `getUserInfo` + `getAuthorization` par les équivalents du projet cible.

---

## 7. Fichiers modifiés hors du service

| Fichier | Modification |
|---|---|
| `src/cache/server/key.ts` | Import `NOTIFICATION_GRAPH` activé + spread dans `CACHE_GRAPH` |
| `src/hooks/notification/useUserNotification.ts` | Imports `@/modules/notification/*` → `@/services/notification/*` |

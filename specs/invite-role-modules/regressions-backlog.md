# Backlog — Régressions hors scope (identifiées pendant D1–D5)

Rapport source : `docs/raports/invitation-service-v1-v2.md`  
Implémentation réalisée : `specs/invite-role-modules/plan.md`

---

## REG-01 — `completeInvite` ne gère pas le rôle DIRECTION

**Type** : Régression fonctionnelle · **Gravité** : Haute

### Problème
`database/invite.mutations.ts` → `createRoleProfile` n'a pas de `case 'DIRECTION'`.
Si `acceptInviteAction` est appelé pour un invité DIRECTION (au lieu de `completeSignup`),
la transaction échoue sur `throw new Error('Rôle non invitable : DIRECTION')`.

### État actuel
`inviteDirectionAction` → Supabase invite → l'invité arrive sur `/auth/invite` →
`acceptInviteAction` est appelé → CRASH.

Le flow V1 passait par `completeSignup` (auth/members) qui gère DIRECTION via
`createRoleSpecificEntity`. Ce pont n'est pas câblé en V2.

### Options
- **A** (recommandée) : Ajouter `case 'DIRECTION'` dans `createRoleProfile` pointant vers
  `tx.direction.upsert` (si modèle Direction existe) ou no-op si profil non nécessaire.
- **B** : Router `/auth/invite` vers `completeSignup` quand `details.role === 'DIRECTION'`
  (bifurcation côté page).

### Fichiers concernés
- `src/services/invite/database/invite.mutations.ts` → `createRoleProfile`
- `src/app/auth/invite/page.tsx` (ou équivalent) → logique de routing

### Commande post-implémentation
```bash
npx tsx scripts/generate/api/api.ts invite
```

---

## REG-02 — Cache `checkFunctionsExist` absent (direction/)

**Type** : Performance · **Gravité** : Faible

### Problème
`invite/direction/database.ts` → `checkFunctionsExist` fait un `prisma.function.findMany`
sans cache. V1 utilisait `unstable_cache` + tag `CACHE.FUNCTIONS(orgId)`.
En V2 le système cache est `"use cache"` + `cacheTag` + `cacheLife` (voir `src/cache/server/`).

Pas de régression fonctionnelle — risque de N+1 si `inviteDirectionAction` est appelé
en boucle (import CSV par exemple).

### Action recommandée
Créer `invite/cache.ts` avec un graph d'invalidation `INVITE_GRAPH` et brancher
`checkFunctionsExist` sur `"use cache"` + `cacheTag(CACHE.FUNCTIONS(orgId))` quand
le service Function aura son propre `cache.ts`.

### Fichiers concernés
- `src/services/invite/direction/database.ts` → `checkFunctionsExist`
- `src/services/invite/cache.ts` (à créer)
- `src/cache/server/key.ts` → ajouter entrée `INVITE` si nécessaire

### Dépendance
Attendre que `src/services/function/cache.ts` expose `FUNCTIONS_GRAPH`.

---

## REG-03 — `notifyInvitationStakeholders` : stub push

**Type** : Feature manquante · **Gravité** : Moyenne

### Problème
`invite/notifications.ts` appelle `sendPushNotificationToUserById` qui retourne
`{ success: false, error: 'Non implémenté' }` dans `src/services/notification/user.ts`.
Les notifications sont silencieusement absorbées (`Promise.allSettled`).

### Action recommandée
Implémenter `sendPushNotificationToUserById` dans `services/notification/user.ts`
(Web Push API ou FCM selon la décision infra). Hors scope service `invite/`.

### Fichiers concernés
- `src/services/notification/user.ts` → `sendPushNotificationToUserById`
- `src/services/notification/database.ts` → persistance des subscriptions

---

## REG-04 — `resendInvitationAction` : durée fixe 7j non configurable

**Type** : Régression légère · **Gravité** : Faible

### Problème
```ts
const newExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
```
Le renvoi d'invitation repart toujours sur 7 jours, même si l'invitation originale
avait une durée différente. V1 régénérait un token avec `generateInvitationToken(expiresInDays)`.

### Action recommandée
Passer `expiresInDays` en paramètre optionnel de `resendInvitationAction` et utiliser
`core.generateInviteToken(expiresInDays)`.

### Fichiers concernés
- `src/services/invite/actions/invite.mutations.ts` → `resendInvitationAction`

---

## REG-05 — `acceptInviteAction` ne lit pas `details.name` pour firstName/lastName

**Type** : UX · **Gravité** : Faible

### Problème
`acceptInviteAction` prend `firstName?` et `lastName?` du formulaire.
`inviteStudentAction` stocke `details.name = "Prénom Nom"`.
Si l'invité ne remplit pas le formulaire, le nom stocké dans `details` est ignoré.

En V1, `completeSignup` extrayait `firstName/lastName` depuis `details.name` via `split(' ')`.

### Action recommandée
Dans `acceptInviteAction`, si `firstName` et `lastName` sont absents du formulaire,
lire `details.name` et le splitter (fallback).

### Fichiers concernés
- `src/services/invite/actions/invite.mutations.ts` → `acceptInviteAction`
- `src/services/invite/database/invite.mutations.ts` → `completeInvite` params

---

## Synthèse priorisation

| ID | Description | Gravité | Effort est. | Priorité | Statut |
|---|---|---|---|---|---|
| REG-01 | `createRoleProfile` sans case DIRECTION | Haute | ~1h | P1 — blocker | ✅ Traité |
| REG-03 | Stub push notifications | Moyenne | ~3h (infra) | P2 | ✅ Traité — service notification/ complet |
| REG-04 | `resendInvitationAction` durée fixe | Faible | ~15min | P3 | ✅ Traité |
| REG-05 | `acceptInviteAction` ignore `details.name` | Faible | ~20min | P3 | ✅ Traité |
| REG-02 | Cache `checkFunctionsExist` | Faible | ~1h | P4 — dépend infra cache | ✅ Traité — `services/function/` créé + cache branché |

### Régressions restantes
- **REG-03** : ✅ `services/notification/` complet — VAPID + DB + actions + cache
- **REG-02** : Traiter après création de `services/function/` avec son `cache.ts`

# Métadonnées Supabase, Cache Utilisateur & Contrôle d'Accès

Ce document décrit le modèle de données d'authentification, la séparation entre autorisation (`app_metadata`) et profil (`user_metadata`), le cache serveur à 3 niveaux de `getUserInfo()`, ainsi que les primitives de permissions (`authAccess`).

---

## 1. Séparation stricte `app_metadata` vs `user_metadata`

La source unique de vérité des types et des clés est [`apps/web/src/types/user.ts`](../../../apps/web/src/types/user.ts).

### A. `app_metadata` (`AppMetadata`) — Autorisation (Serveur uniquement)

Tout ce qui sert à autoriser une action ou à déterminer le contexte multi-tenant vit **exclusivement** dans `user.app_metadata` :

```typescript
export interface Organization {
  id?: string
  name?: string
  slug?: string
  logo?: string
  type?: OrganizationType       // 'INSTITUTION' | 'PERSONAL'
  permissions?: string[]
  responsable?: boolean
  departmentId?: string
  studentId?: string
  teacherId?: string
  parentId?: string
  directionId?: string
}

export interface AppMetadata {
  role?: Role                   // 'ADMIN' | 'DIRECTION' | 'TEACHER' | 'STUDENT' | 'PARENT' | 'GUEST'
  function?: Functions          // 'SUPER_ADMIN' | 'PRINCIPAL' | 'SECRETARY' | 'MEMBER' …
  status?: UserStatus           // 'NEW' | 'PENDING' | 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'ON_LEAVE' | 'INVITED'
  organization?: Organization   // Organisation active courante
  organizations?: Organization[] // Toutes les organisations rattachées au compte
}
```

- **Lecture sans repli (`mapUserInfo`)** : dans [`apps/web/src/modules/user/utils.ts`](../../../apps/web/src/modules/user/utils.ts), `mapUserInfo()` lit ces clés dans `user.app_metadata` **sans jamais faire de fallback sur `user_metadata`**. Une clé absente reçoit la valeur la plus restrictive :
  - `role` $\rightarrow$ `UserRoles.GUEST`
  - `function` $\rightarrow$ `Functions.MEMBER`
  - `status` $\rightarrow$ `UserStatus.PENDING`
  - `organizations` $\rightarrow$ `[]`
- **Écriture réservée au serveur** : via [`apps/web/src/modules/user/access.ts`](../../../apps/web/src/modules/user/access.ts) (`import "server-only"`, utilisant `supabase.auth.admin.updateUserById`) :
  - `updateUserAccess(targetUserId, patch)` : modifie l'`app_metadata` d'un utilisateur cible et invalide son cache (`CacheInvalidation.onUserUpdate`).
  - `setUserAccess(patch)` : modifie l'`app_metadata` de l'utilisateur connecté (identité issue de `getUserInfo()`).
  - `setCurrentOrganization(orgId)` : change l'organisation active (`organization`) à partir d'une entrée présente dans `user.organizations`.
  - `syncUserOrganizationProfile({ orgId, role, profileId, status? })` : injecte le `profileId` métier (`teacherId`, `studentId`, `directionId`, `parentId`) dans `organizations` et `organization`.

---

### B. `user_metadata` (`UserMetadata`) — Profil (Non fiable pour l'autorisation)

Les clés de `user_metadata` sont modifiables par le client via l'API Supabase Auth. **Elles ne doivent jamais servir à autoriser une action.**

```typescript
export interface UserMetadata {
  name?: string
  avatar_url?: string
  phone?: string
  isConnected?: boolean
  invited_by?: InvitedBy
  invitationToken?: string
  invitationType?: string
}
```

- **Écriture** : via [`apps/web/src/modules/user/update.ts`](../../../apps/web/src/modules/user/update.ts) :
  - `setUserInfo(patch)` : met à jour le profil de l'utilisateur courant (`supabase.auth.updateUser`) et rafraîchit le cache (`getUserInfo({ refresh: true })`).
  - `updateUserMetadata(targetUserId, patch)` : met à jour le profil d'un utilisateur cible via l'API admin (ex. lors d'une invitation).
  - `cleanUserMetadata({ user_metadata })` : réinitialise toutes les clés de `USER_METADATA_KEYS` à `null` avant d'appliquer les valeurs fournies (sans toucher à `app_metadata`).

---

### C. `AuthMetadata`, `UserInfo` & `PublicUserInfo`

- **`AuthMetadata`** : champs natifs ou calculés (`id`, `email`, `email_verified`, `phone_verified`, `online_at`, `updated_at`), jamais écrits dans les metadata.
- **`UserInfo`** (`AppMetadata & UserMetadata & AuthMetadata`) : vue unifiée retournée par `getUserInfo()`.
- **`PublicUserInfo`** : type destiné aux composants clients, expurgé des clés sensibles :
  - `SENSITIVE_USER_KEYS` : `'organizations'`, `'invited_by'`, `'invitationType'`
  - `SENSITIVE_ORGANIZATION_KEYS` : `'permissions'`, `'responsable'`, `'departmentId'`, `'studentId'`, `'teacherId'`, `'parentId'`, `'directionId'`

---

## 2. Résolution & Cache à 3 niveaux (`getUserInfo`)

Fichier : [`apps/web/src/modules/user/userInfo.ts`](../../../apps/web/src/modules/user/userInfo.ts)

### Résolution dual-mode (Cookies SSR vs Bearer JWT)

1. **`getUserId()`** (wrappé dans `React.cache`) :
   - Si un header `Authorization: Bearer <token>` est présent : appelle `createBearerClient().auth.getClaims(bearer)` ([`bearer.ts`](../../../apps/web/src/utils/supabase/bearer.ts)) pour vérifier la signature JWT (car les routes `/api/rpc/*` ne passent pas par le middleware) et extrait `claims.sub`.
   - Sinon (Cookies SSR) : appelle `supabase.auth.getSession()` et décode localement `session.access_token` (`jwtDecode().sub`), le JWT ayant déjà été validé par le middleware.
2. **`fetchUserFromSupabase(userId)`** (en cas de cache miss ou `refresh: true`) :
   - Si Bearer : `await createBearerClient().auth.getUser(bearer)`
   - Sinon : `await (await createClient()).auth.getUser()`
   - Vérifie que `user.id === userId` (protection anti-fuite) puis retourne `mapUserInfo({ user })`.

### Les 3 niveaux de protection et de cache

| Niveau | Portée | Mécanisme |
|---|---|---|
| **1. `React.cache()`** | Intra-requête | Clé composite `[userId, options]`. Si 10 composants RSC ou actions appellent `getUserInfo()`, une seule exécution a lieu. |
| **2. Cache LRU** | Inter-requêtes (TTL 10 min) | Stocké en mémoire ([`lru-cache.ts`](../../../apps/web/src/modules/user/lru-cache.ts), max 1000 utilisateurs). Lecture `O(1)`. |
| **3. Vérification d'identité** | Sécurité | Contrôle strict `user.id === userId` avant toute mise en cache ou retour. |

| Option `getUserInfo(options)` | Comportement |
|---|---|
| `{ cache: true, refresh: false }` *(défaut)* | Lit le cache LRU s'il est chaud, sinon interroge Supabase et alimente le LRU. |
| `{ cache: true, refresh: true }` | Ignore la lecture LRU, interroge Supabase et met à jour le LRU. *(Attention : ne pas l'appeler après `setUserAccess()` dans la même requête à cause de la mémoïsation `React.cache`)*. |
| `{ cache: false }` | Ignore complètement le LRU (lecture et écriture). |

---

## 3. Contrôle d'Accès Serveur (`authAccess`)

Fichier : [`apps/web/src/modules/auth/persmission/acces.ts`](../../../apps/web/src/modules/auth/persmission/acces.ts) (ré-exporté par `@/services/auth`).

```typescript
type AuthAccessParams = {
  requiredRole?: Role | Role[]
  requiredFunction?: Functions | Functions[]
  requiredPermission?: { action: Action; resource: Resource; resourceId?: string }
  requiredOrgType?: OrganizationType
  allowPersonalOrg?: boolean
}
```

### Séquence de vérification de `authAccess(params)`

1. **Authentification** : appelle `getUserInfo()`. Si `!user?.id` $\rightarrow$ `{ error: ERRORS.AUTH.UNAUTHORIZED }`.
2. **Scope Organisation (`orgId`)** : extrait `orgId = user.organization?.id`. Si absent $\rightarrow$ `{ error: ERRORS.ORG.NOT_FOUND }`.
3. **Type d'organisation (`requiredOrgType`)** : si spécifié (`'INSTITUTION'` ou `'PERSONAL'`), vérifie `user.organization?.type === requiredOrgType` (s'applique même à `SUPER_ADMIN`).
4. **Rôle & Fonction (`getAuthorization`)** :
   - Vérifie `requiredRole` et `requiredFunction`.
   - Par défaut, une organisation `PERSONAL` n'est acceptée par `getAuthorization` que si `allowPersonalOrg: true` (ou si l'action cible explicitement `requiredOrgType: 'PERSONAL'`).
   - `SUPER_ADMIN` bypasse la vérification de rôle/fonction.
5. **Permission fine (`requiredPermission`)** : vérifie `hasPermission(user.organization?.permissions, requiredPermission)` (sauf `SUPER_ADMIN`).
6. **Retour discriminé** : `{ data: { user: AuthenticatedUser, orgId: string } } | { error: string }`.


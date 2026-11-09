# Auth — Contexte & Architecture Globale

L'authentification d'**Attendancy** repose sur **Supabase Auth** avec deux modes de transport côté client (**Cookies SSR** sur `apps/web`, **Bearer JWT** via RPC sur les clients Vite/Tauri comme `apps/teacher`), qui convergent côté serveur vers **une seule primitive unifiée** : `getUserInfo()` et son wrapper d'autorisation `authAccess()`.

Pour éviter toute duplication et isoler chaque responsabilité, la documentation détaillée est découpée par sous-domaine dans [`docs/techs/auth/`](./README.md).

---

## 1. Carte des Sous-Domaines (`docs/techs/auth/`)

| Sous-domaine | Fichier dédié | Quand le consulter ou le mettre à jour ? |
|---|---|---|
| **1. Métadonnées, Cache & Permissions** | [`metadata-and-access.md`](./metadata-and-access.md) | Modification de `UserInfo` (`app_metadata` vs `user_metadata`), du cache LRU/React de `getUserInfo()`, de `setUserAccess()` ou des règles `authAccess()`. |
| **2. Routage Post-Auth, Profil & Hub d'Espaces** | [`routing-and-onboarding.md`](./routing-and-onboarding.md) | Modification de `/auth/callback`, `/auth/redirect`, `/auth/profile` (`checkUserProfile` / `upsertUserProfile`), `redirectUser()`, ou du sélecteur `/auth/org/info` ↔ `/auth/org/profile`. |
| **3. Inscriptions Autonomes (`PRINCIPAL` & `PERSONAL`)** | [`signup-flows.md`](./signup-flows.md) | Modification du parcours fondateur (`/auth/signup/principal` $\rightarrow$ `/auth/org/setup`) ou du parcours indépendant (`/auth/signup/personal`, `createPersonalOrgAction`). |
| **4. Émission & Cycle de Vie des Invitations** | [`invitations-emission.md`](./invitations-emission.md) | Modification de `inviteUser()`, `pickInviteUserMetadata()`, `saveInvitationWithAudit()`, des statuts d'invitation, de la relance ou de la révocation. |
| **5. Acceptation & Refus d'Invitation (Lien vs Inbox)** | [`invitations-acceptance.md`](./invitations-acceptance.md) | Modification de `/auth/invite`, `/auth/welcome`, `completeSignup()`, ou des actions de notification interne (`acceptInboxInvitationAction` / `declineInboxInvitationAction`). |
| **6. Client Vite / Tauri (`apps/teacher`)** | [`client-tauri.md`](./client-tauri.md) | Modification de `@attendancy/auth`, `getSessionState()` (`offline-stale`), `claimLocalData()`, `useCurrentUser()`, du proxy RPC Bearer ou des guards TanStack Router. |

---

## 2. Vue Synthétique du Système

### A. Convergence Serveur (Cookies SSR + Bearer JWT)

Côté serveur (`apps/web`), les Server Actions utilisent toutes `authAccess()` ou `getUserInfo()`, quel que soit l'appelant (page Web Next.js ou client Tauri via `POST /api/rpc/[action]`) :

```text
Appel entrant
  ├─ Web Next.js (Cookie de session rafraîchi par le middleware)
  └─ Client Tauri / Vite (Header Authorization: Bearer <access_token> sur /api/rpc/[action])
       │
       ▼
getUserInfo()  (apps/web/src/modules/user/userInfo.ts)
  ├─ 1. Identification (getUserId) :
  │    ├─ Si Bearer : createBearerClient().auth.getClaims(bearer) → vérifie la signature JWT → sub
  │    └─ Si Cookie : createClient().auth.getSession() → jwtDecode(access_token).sub
  ├─ 2. Cache multi-niveaux : React.cache([userId, options]) + LRU (TTL 10 min)
  └─ 3. Fetch Supabase (sur miss/refresh) :
       ├─ Si Bearer : await createBearerClient().auth.getUser(bearer)
       └─ Si Cookie : await (await createClient()).auth.getUser()
            ↓
       mapUserInfo({ user }) → fusionne app_metadata (accès) + user_metadata (profil) sans fallback
```

### B. Cloisonnement `app_metadata` vs `user_metadata`

| Magasin Supabase | Rôle | Clés (`apps/web/src/types/user.ts`) | Qui peut écrire ? |
|---|---|---|---|
| **`app_metadata`** (`AppMetadata`) | **Autorisation & Contexte Org** | `role`, `function`, `status`, `organization`, `organizations` | **Serveur uniquement** (`setUserAccess`, `updateUserAccess` via service-role) |
| **`user_metadata`** (`UserMetadata`) | **Profil & Contexte UX d'invitation** | `name`, `avatar_url`, `phone`, `isConnected`, `invited_by`, `invitationToken`, `invitationType` | Client ou Serveur (`setUserInfo`, `updateUserMetadata`) — **jamais utilisé pour autoriser** |

### C. Panorama des Flux d'Entrée Utilisateur

1. **Fondateur d'établissement (`PRINCIPAL`)** : s'inscrit sur `/auth/signup/principal` $\rightarrow$ confirme son email (`/auth/callback`) $\rightarrow$ crée son établissement sur `/auth/org/setup` (`createOrgAction`) $\rightarrow$ complète son profil civique sur `/auth/profile` $\rightarrow$ `/{orgSlug}/direction`. (Voir [`signup-flows.md`](./signup-flows.md)).
2. **Utilisateur indépendant (`PERSONAL`)** : s'inscrit sur `/auth/signup/personal` (Web ou Tauri via `signupPersonalDesktopAction`) $\rightarrow$ choisit son rôle (`TEACHER`, `STUDENT`, `PARENT`) dans `/auth/org/info` puis `/auth/org/profile` (`createPersonalOrgAction`) $\rightarrow$ complète `/auth/profile` $\rightarrow$ `/personal/{slug}/teacher` (ou `/{slug}/{role}`). (Voir [`signup-flows.md`](./signup-flows.md)).
3. **Utilisateur invité — Nouveau compte (ou lien magique)** : reçoit un email/lien généré par `inviteUser()` (seul le profil `pickInviteUserMetadata` est mis dans `user_metadata`) $\rightarrow$ `/auth/invite` (hash `#access_token`) $\rightarrow$ `/auth/welcome` $\rightarrow$ définit son mot de passe (`signupMemberAction`) et exécute `completeSignup()` $\rightarrow$ `/auth/profile` $\rightarrow$ `/{orgSlug}/{role}`. (Voir [`invitations-emission.md`](./invitations-emission.md) et [`invitations-acceptance.md`](./invitations-acceptance.md)).
4. **Utilisateur invité — Compte existant (Inbox interne)** : `inviteUser()` détecte le compte dans `prisma.user`, n'envoie aucun email Supabase et crée atomiquement une notification interne (`createInvitationNotification`). L'utilisateur accepte ou refuse directement depuis sa boîte de réception via `acceptInboxInvitationAction` / `declineInboxInvitationAction` (`inbox-invitation.ts`), sans écraser son organisation active s'il en a déjà une. (Voir [`invitations-acceptance.md`](./invitations-acceptance.md)).

---

## 3. Invariants Globaux (Non négociables)

1. **`orgId` serveur uniquement** : toujours extrait de `auth.data.orgId` (`authAccess()`), jamais du body, des query params ou des headers.
2. **Aucune autorisation via `user_metadata`** : `role`, `function`, `status`, `organization` et `organizations` sont lus exclusivement depuis `app_metadata` sans repli sur `user_metadata`.
3. **Pas de relecture `getUserInfo({ refresh: true })` après `setUserAccess()` dans la même requête** : `React.cache()` pourrait ré-injecter l'état pré-écriture dans le cache LRU.
4. **Transport Tauri 100 % RPC** : les applications clientes (`apps/teacher`) n'appellent que des Server Actions enregistrées dans `apps/web/src/lib/rpc/actions.ts` via `POST /api/rpc/[action]` avec Bearer token (l'ancienne route `/api/auth/me` est dépréciée et retourne `410`).
5. **Source de vérité `classId` d'une invitation étudiant** : toujours lue depuis `invitation.resourceId` (quand `invitation.resourceType === "CLASS"`), jamais depuis `details.enrollment.classId`.

# Documentation Technique — Authentification (`docs/techs/auth/`)

Ce dossier centralise la documentation d'architecture du système d'authentification, d'autorisation, d'onboarding et d'invitation d'Attendancy.

Le point d'entrée synthétique se trouve dans [`auth-context.md`](./auth-context.md).

---

## Découpage par responsabilité

Chaque fichier couvre **un seul sous-domaine** afin qu'une évolution ciblée ne nécessite la mise à jour que du document concerné :

| Fichier | Périmètre & Responsabilité | Modules / Packages couverts |
|---|---|---|
| [`metadata-and-access.md`](./metadata-and-access.md) | **Modèle de données Auth, Cache & RBAC** : séparation `app_metadata` (accès serveur) vs `user_metadata` (profil client), cache 3 niveaux (`getUserInfo`), `authAccess()`. | `src/types/user.ts`, `src/modules/user/`, `src/modules/auth/persmission/` |
| [`routing-and-onboarding.md`](./routing-and-onboarding.md) | **Routage post-auth, Profil & Hub d'espaces (Web)** : callback PKCE (`/auth/callback`), hub `/auth/redirect`, sentinelle `dateOfBirth` (`/auth/profile`), `redirectUser()`, sélecteur d'organisation et de rôle (`/auth/org/info`, `/auth/org/profile`). | `src/app/auth/`, `src/config/redirects.ts`, `src/modules/auth/profile/`, `src/services/organization/` |
| [`signup-flows.md`](./signup-flows.md) | **Flux d'inscription autonome** : parcours Fondateur d'établissement (`DIRECTION` / `PRINCIPAL` $\rightarrow$ `/auth/org/setup`) et parcours Compte Personnel (`PERSONAL` sur Web et Tauri). | `src/modules/auth/actions/signup.ts`, `src/features/personal/services/organization/` |
| [`invitations-emission.md`](./invitations-emission.md) | **Émission & Cycle de vie des invitations** : orchestrateur `inviteUser()`, filtrage `pickInviteUserMetadata()`, remise Email/Lien vs Notification Inbox interne, statuts, relance (`resendInvitationAction`) et révocation (`deleteInvitationUserAction`). | `src/modules/invitation/` |
| [`invitations-acceptance.md`](./invitations-acceptance.md) | **Acceptation & Refus d'invitation** : voie Lien externe (`/auth/invite` $\rightarrow$ `/auth/welcome` $\rightarrow$ `completeSignup()`) vs voie Inbox interne (`acceptInboxInvitationAction` / `declineInboxInvitationAction`), révocation des doublons et idempotence des profils. | `src/modules/auth/members/complete-signup.ts`, `src/modules/auth/members/inbox-invitation.ts`, `src/modules/auth/members/utils.ts` |
| [`client-tauri.md`](./client-tauri.md) | **Authentification Client Vite / Tauri (`apps/teacher`)** : machine à états `getSessionState()` (`signed-in`, `offline-stale`, `signed-out`), isolation IndexedDB (`claimLocalData`), proxy RPC Bearer, `useCurrentUser()`, guards TanStack Router. | `packages/auth/`, `packages/app/`, `packages/cache/`, `apps/teacher/` |


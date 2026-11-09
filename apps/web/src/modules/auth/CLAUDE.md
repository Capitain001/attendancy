# Module Auth — CLAUDE.md

Contexte complet et architecture détaillée : [`docs/techs/auth/auth-context.md`](../../../../docs/techs/auth/auth-context.md) et [`docs/techs/auth/`](../../../../docs/techs/auth/README.md).

## Rôle de ce module

Orchestre l'authentification, le contrôle d'accès (`authAccess`), l'inscription (`PRINCIPAL` / `PERSONAL`), la complétion du profil civique et l'acceptation d'invitations (via lien externe ou notification Inbox interne).

## Primitives à utiliser

- **Dans une Server Action / RSC (contrôle d'accès + `orgId`)** : `authAccess()` (`persmission/acces.ts`, ré-exporté par `@/services/auth`)
  ```typescript
  const auth = await authAccess({ requiredRole: "TEACHER", allowPersonalOrg: true });
  if (!auth.data) return { error: auth.error };
  const { orgId, user } = auth.data;
  ```
- **Pour lire le profil utilisateur courant (Cookies SSR ou Bearer RPC)** : `getUserInfo()` depuis `@/modules/user`
- **Pour les opérations Supabase Auth serveur** (login, logout, signup, OAuth, admin) : fonctions de [`supabase.ts`](./supabase.ts)
- **Pour exposer le profil au client RPC (Tauri)** : `getCurrentUserAction()` dans [`rpc/actions.ts`](./rpc/actions.ts)

## Invariants

- **`orgId` toujours depuis `auth.data.orgId`** — jamais du body, des query params ou des headers.
- **Dual-mode transparent** : `authAccess()` et `getUserInfo()` supportent nativement les cookies SSR (Web) et l'en-tête `Authorization: Bearer <token>` (clients Tauri via `/api/rpc/[action]`, vérifié par `createBearerClient()` dans `src/utils/supabase/bearer.ts`).
- **Séparation `app_metadata` / `user_metadata`** : `role`, `function`, `status`, `organization` et `organizations` sont lus/écrits exclusivement dans `app_metadata` (`src/modules/user/access.ts`), jamais dans `user_metadata`.
- `"use server"` uniquement sur les fichiers d'actions (`actions/`, `members/actions.ts`, `members/complete-signup.ts`, `members/inbox-invitation.ts`, `profile/user.ts`, `rpc/actions.ts`).
- Les helpers DB dans [`members/utils.ts`](./members/utils.ts) utilisent `import 'server-only'` et reçoivent le client Prisma ou transactionnel (`tx`) fourni par leur appelant.
- `enrollStudentInClass` délègue à `createStudentEnrollmentRaw` du service `student-enrollment` ; les groupes ajoutés sont idempotents (`skipDuplicates: true`).
- Les flux d'acceptation d'invitation (`completeSignup` et `acceptInboxInvitationAction`) matérialisent les liens parent-étudiant avec `ensureParentRelation` depuis `@/services/parent-relation/server`, en passant la transaction courante.
- Pour l'inscription étudiant issue d'une invitation, `invitation.resourceId` avec `resourceType === "CLASS"` est la seule source du `classId` ; `details.enrollment` peut fournir les `groupIds`, mais son `classId` n'est pas lu.

## Permissions & Rôles

- [`persmission/acces.ts`](./persmission/acces.ts) → `authAccess({ requiredRole?, requiredFunction?, requiredPermission?, requiredOrgType?, allowPersonalOrg? })`
- [`persmission/autorization.ts`](./persmission/autorization.ts) → `getAuthorization()`
- [`persmission/config.ts`](./persmission/config.ts) → Configuration de la hiérarchie des rôles et fonctions

## Auth Client (Vite / Tauri — `apps/teacher`)

Gérée par le package partagé `@attendancy/auth` (`packages/auth/`) et documentée dans [`docs/techs/auth/client-tauri.md`](../../../../docs/techs/auth/client-tauri.md).

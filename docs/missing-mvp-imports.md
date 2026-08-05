# Imports MVP manquants

Fichiers référencés dans le code mais introuvables dans la branche actuelle.
À fournir par l'utilisateur.

_Dernière mise à jour : 2026-08-04_

---

## 1. Bloquants — branchés aux pages / features actives (9 fichiers)

### Auth (5)

| Fichier cassé | Import manquant | Notes |
|---|---|---|
| `src/components/auth/responsable/SignupMainOrg.tsx` | `@/services/auth/responsable/signup` | + cascade `useActionState` signature |
| `src/components/auth/operations/SignInPage.tsx` | — | `useActionState` signature incorrecte (cascade depuis `loginAction`) |
| `src/hooks/auth/use-login-form.ts` | `loginAction`, `LoginResult` depuis `@/services/auth` | — |
| `src/hooks/auth/index.ts` | `./use-login-form` introuvable | cascade |
| `src/modules/auth/persmission/autorization.ts` + `acces.ts` | `AuthorizationResult` type incompatible | 8 erreurs TS |

### Fonctions / UserFunctions (2)

| Fichier cassé | Import manquant |
|---|---|
| `src/hooks/data/userFunctions/useUserFunctions.ts` | `getUserFunctionsAction`, `getUsersByFunctionAction`, `AssignFunctionInput`, `UserFunctionAssignment` absents de `@/services/function` |

### Invitations (3)

| Fichier cassé | Import manquant |
|---|---|
| `src/hooks/invitation/useInvitationActions.ts` | `@/services/invite` (service inexistant) |
| `src/hooks/invitation/useInvitations.ts` | `@/services/invite`, `@/services/invite/queries` |
| `src/hooks/invitation/useStudentInvitationActions.ts` | `@/services/invite` |

### Teacher (2)

| Fichier cassé | Import manquant |
|---|---|
| `src/hooks/teacher/useTeacherActions.ts` | `createTeacherAction`, `updateTeacherAction`, `deleteTeacherAction` — absents de `@/services/teacher/actions` (service ne crée pas de teacher) |
| `src/hooks/teacher/index.ts` | `./useTeacherActions` introuvable (cascade) |

### Organisation (1)

| Fichier cassé | Problème |
|---|---|
| `src/services/organization/utils.ts` | `slugify` npm non installé |

### Erreurs en cascade (disparaissent quand bloquants fournis)

- `useUserFunctions.ts` — `res` of type `unknown` (lignes 75, 85)
- `useInvitationActions.ts` — `result` of type `unknown` (lignes 60, 62, 87, 90, 94, 130, 131)

---

## 2. UI non branchée aux pages (faible priorité — 4 fichiers)

| Fichier cassé | Import manquant | Raison |
|---|---|---|
| `src/components/ui/badge.tsx` | `@/config/styles` | Variante badge non utilisée |
| `src/components/users/avatars/avatar-1.tsx` + `LiveAvatars.tsx` | `@/lib/project` | Avatar live non branché |
| `src/components/users/UserInfoPopover.tsx` | `@/types/teacher` | Popover non branché |
| `src/hooks/notification/usePushNotifications.ts` + `useUserNotification.ts` | `checkBrowserSupport`, `validateHTTPS`, `getCurrentPermission` absents de `@/modules/notification/utils` | Hook push-notif non branché |
| `src/components/planning/hook/usePlanningEvents.ts` | `../types` (fichier absent) + `ERRORS.SCHEDULE` (clé absente) | Hook planning non branché |

---

## ✅ Résolus

| Import | Fix appliqué |
|---|---|
| `@/services/fonctions/actions` dans `useFonctions.ts` | → `@/services/function/actions` + mapping (`addFunctionAction`→`createFunctionAction`, `removeFunctionAction`→`deleteFunctionAction`) |
| `getMainFunctionsWithUsersAction` dans `useManageFunctions.ts` | → deux queries composées : `getFunctionsAction()` (filter isMain) + `getFunctionProfilesAction(id)` |
| `@/services/auth/providers` dans `GoogleSignInButton.tsx` | déjà importé depuis `@/modules/auth` |
| `@/components/animate-ui/icons/log-in` dans `AuthButton.tsx`, `AuthLinks.tsx` | fichier existe — fausse alarme |
| `use-sound` dans `skiper25.tsx` | package installé (`^5.0.0`) — fausse alarme |
| `NotificationType` depuis `@prisma/client` dans `AdminNotificationList.tsx` | → `@/generated/prisma` |
| `@/components/auth/AuthError` | chemin corrigé → `@/components/auth/page/AuthError` |
| `@/components/auth/SignupLanding` | chemin corrigé → `@/components/auth/signup/SignupLanding` |
| `../operations/LoginForm` | chemin corrigé → `../login/LoginForm` |
| `@/components/loader/Loader` | chemin corrigé → `@/components/loaders/Loader` |
| `upsertUserProfile` depuis `@/modules/user` | → `@/modules/auth/profile/user` |
| `createRoleSpecificEntity` depuis `@/modules/user` | → `@/modules/auth/members/utils` |
| `assignMultipleFunctionsToUser` depuis `@/modules/user` | → `@/modules/auth/members/utils` |
| `getRoleProfileKey` depuis `@/modules/user` | export ajouté via `./profile` dans barrel |
| `export * from './planning'` dans `types/index.ts` | supprimé (fichier commentaire) |
| `invalidateCache("PROGRAM_UE")` | → `invalidateCache("PROGRAM")` |
| `CACHE.FUNCTIONS` | → `CACHE.FUNCTION` |
| `@/services/notification/*` (8 fichiers) | → `@/modules/notification/*` |
| `logoutAction` dans `LogOutForm` | → `logoutActionForm` |
| `deletedAt` sur `Attendance` / `Notification` | supprimé (pas de soft-delete) |
| `groupBy _count` Prisma v7 | cast explicite `(row._count as { field: number }).field` |

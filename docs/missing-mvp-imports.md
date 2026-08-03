# Imports MVP manquants

Fichiers référencés dans le code mais introuvables dans la branche actuelle.
À fournir par l'utilisateur.

---

## 1. Bloquants — branchés aux pages

### Composants auth (pages `/auth/*`, `/login`)

| Import manquant | Consommateur(s) |
|---|---|
<!-- | `@/components/auth/AuthError` | `src/app/auth/error/page.tsx` |
| `@/components/auth/SignupLanding` | `src/app/auth/signup/page.tsx` |
| `../operations/LoginForm` | `src/components/auth/form/AuthForm.tsx`, `src/components/auth/operations/index.ts` | -->

| `@/components/animate-ui/icons/log-in` | `AuthButton.tsx`, `AuthLinks.tsx` |
| `@/components/illustrations/Resourceillustration` | `SignupPrincipalUi.tsx` |
| `@/services/auth/principal/signup` | `src/components/auth/principal/SignupPrincipal.tsx` |
| `@/services/auth/responsable/signup` | `src/components/auth/responsable/SignupMainOrg.tsx` |
| `@/services/auth/providers` | `src/components/auth/ui/GoogleSignInButton.tsx` |

### Exports manquants dans modules existants (bloquants)

| Export manquant | Module | Consommateur(s) |
|---|---|---|
| `loginAction` | `@/services/auth` | `src/hooks/auth/use-login-form.ts` |
| `LoginResult` (type) | `@/services/auth` | `src/hooks/auth/use-login-form.ts` |
| `updateOrganizationLogo` | `@/services/organization` | `src/hooks/organization/useLogoUploader.ts` |
| `getOrganizationBySlug` | `@/services/organization` | `src/hooks/organization/useOrganization.ts` |
| `createTeacherAction` | `@/services/teacher/actions` | `src/hooks/teacher/useTeacherActions.ts` |
<!-- | `updateTeacherAction` | `@/services/teacher/actions` | `src/hooks/teacher/useTeacherActions.ts` | -->
| `deleteTeacherAction` | `@/services/teacher/actions` | `src/hooks/teacher/useTeacherActions.ts` |
| `getUserRoleStatsAction` | `@/modules/user` | `src/hooks/users/useUserStats.ts` |

### Services entiers manquants (bloquants)

| Import manquant | Consommateur(s) |
|---|---|
| `@/services/invite` (barrel + queries) | `hooks/invitation/useInvitationActions.ts`, `useInvitations.ts`, `useStudentInvitationActions.ts` |
| `@/services/fonctions/actions` | `hooks/data/fonctions/useFonctions.ts` |
| `@/services/fonctions/types` | `hooks/data/fonctions/useFonctions.ts` |
| `@/services/fonctions` (barrel) | `hooks/data/fonctions/useManageFunctions.ts` |
| `@/services/fonctions/user` | `hooks/data/userFunctions/useUserFunctions.ts` |
| `@/services/fonctions/user/validation` | `hooks/data/userFunctions/useUserFunctions.ts` |
| `@/services/fonctions/user/types` | `hooks/data/userFunctions/useUserFunctions.ts` |
| `@/services/users/profile/actions` | `hooks/data/userFunctions/useProfileFunctions.ts` |
| `@/services/users/profile/types` | `hooks/data/userFunctions/useProfileFunctions.ts` |
| `@/types/permissions` | `modules/auth/persmission/autorization.ts`, `persmission/utils.ts` |
| `slugify` (npm) | `src/services/organization/utils.ts` |

### Erreurs secondaires en cascade (disparaissent quand bloquants fournis)

- `SignupPrincipal.tsx`, `SignupMainOrg.tsx` — `useActionState` signature incorrecte
- `hooks/invitation/useInvitationActions.ts` — `result` of type `unknown` (lignes 60, 62, 87, 90, 94, 130, 131)
- `hooks/data/userFunctions/useUserFunctions.ts` — `res` of type `unknown` (lignes 75, 85)
- `hooks/teacher/useTeacherActions.ts` — `result` of type `unknown` (lignes 24, 54, 82)

---

## 2. UI non branchées aux pages (faible priorité)

Ces fichiers ont des erreurs TS mais ne bloquent aucune route active.

| Import manquant | Consommateur(s) | Raison |
|---|---|---|
| `@/config/styles` | `src/components/ui/badge.tsx` | Variante badge non utilisée |
| `@/lib/project` | `avatars/avatar-1.tsx`, `LiveAvatars.tsx` | Avatars live non branchés |
| `../RealTime/UserIcon` (`LiveUserIcon`) | `AvatarSelect.tsx`, `CourseTeachersSelect.tsx`, `SelectCourseTeachers.tsx` | Sélecteurs non montés sur pages |
| `../tools/ReusableDialog` | `CourseTeachersSelect.tsx`, `SelectCourseTeachers.tsx` | Idem |
| `@/types/teacher` | `UserInfoPopover.tsx` | Popover non branché |
| `checkBrowserSupport`, `validateHTTPS`, `getCurrentPermission` | `@/modules/notification/utils` | Hooks push-notif non branchés |
| `use-sound` (npm) | `src/components/design/prim/skiper25.tsx` | Composant design isolé |
| `../types` (planning) | `components/planning/hook/usePlanningEvents.ts` | Hook planning non branché |
| `ERRORS.SCHEDULE` | `components/planning/hook/usePlanningEvents.ts` | Idem |
| `NotificationType` from `@prisma/client` | `AdminCreateNotification.tsx`, `AdminNotificationList.tsx` | Admin notif non branchés |

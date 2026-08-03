# Imports MVP manquants

Fichiers référencés dans le code mais introuvables dans la branche actuelle.
À fournir par l'utilisateur.

---

## Composants UI

| Import manquant | Consommateur(s) |
|---|---|
| `@/components/auth/AuthError` | `src/app/auth/error/page.tsx` |
| `@/components/auth/SignupLanding` | `src/app/auth/signup/page.tsx` |
| `../operations/LoginForm` | `src/components/auth/form/AuthForm.tsx`, `src/components/auth/operations/index.ts` |
| `@/components/loader/Loader` | `FormButton.tsx`, `FormButtonB.tsx`, `GoogleSignInButton.tsx`, `LoadButton.tsx` |
| `@/components/animate-ui/icons/log-in` | `AuthButton.tsx`, `AuthLinks.tsx` |
| `@/components/illustrations/Resourceillustration` | `SignupPrincipalUi.tsx` |
| `../RealTime/UserIcon` | `AvatarSelect.tsx`, `CourseTeachersSelect.tsx`, `SelectCourseTeachers.tsx` |
| `../tools/ReusableDialog` | `CourseTeachersSelect.tsx`, `SelectCourseTeachers.tsx` |

---

## Services manquants

| Import manquant | Consommateur(s) |
|---|---|
| `@/services/auth/principal/signup` | `src/components/auth/principal/SignupPrincipal.tsx` |
| `@/services/auth/responsable/signup` | `src/components/auth/responsable/SignupMainOrg.tsx` |
| `@/services/auth/providers` | `src/components/auth/ui/GoogleSignInButton.tsx` |
| `@/services/fonctions/actions` | `src/hooks/data/fonctions/useFonctions.ts` |
| `@/services/fonctions/types` | `src/hooks/data/fonctions/useFonctions.ts` |
| `@/services/fonctions` (barrel) | `src/hooks/data/fonctions/useManageFunctions.ts` |
| `@/services/fonctions/user` | `src/hooks/data/userFunctions/useUserFunctions.ts` |
| `@/services/fonctions/user/validation` | `src/hooks/data/userFunctions/useUserFunctions.ts` |
| `@/services/fonctions/user/types` | `src/hooks/data/userFunctions/useUserFunctions.ts` |
| `@/services/users/profile/actions` | `src/hooks/data/userFunctions/useProfileFunctions.ts` |
| `@/services/users/profile/types` | `src/hooks/data/userFunctions/useProfileFunctions.ts` |
| `@/services/users/stats` | `src/hooks/users/useUserStats.ts` |
| `@/services/invite` (barrel + queries) | `src/hooks/invitation/useInvitationActions.ts`, `useInvitations.ts`, `useStudentInvitationActions.ts` |
| `@/config/styles` | `src/components/ui/badge.tsx` |
| `@/lib/project` | `src/components/users/avatars/avatar-1.tsx`, `LiveAvatars.tsx` |
| `@/types/teacher` | `src/components/users/UserInfoPopover.tsx` |
| `@/types/permissions` | `src/modules/auth/persmission/autorization.ts`, `persmission/utils.ts` |

---

## Exports manquants dans des modules existants

| Export manquant | Module | Consommateur(s) |
|---|---|---|
| `loginAction` | `@/services/auth` | `src/hooks/auth/use-login-form.ts` |
| `LoginResult` (type) | `@/services/auth` | `src/hooks/auth/use-login-form.ts` |
| `updateOrganizationLogo` | `@/services/organization` | `src/hooks/organization/useLogoUploader.ts` |
| `getOrganizationBySlug` | `@/services/organization` | `src/hooks/organization/useOrganization.ts` |
| `createTeacherAction` | `@/services/teacher/actions` | `src/hooks/teacher/useTeacherActions.ts` |
| `updateTeacherAction` | `@/services/teacher/actions` | `src/hooks/teacher/useTeacherActions.ts` |
| `deleteTeacherAction` | `@/services/teacher/actions` | `src/hooks/teacher/useTeacherActions.ts` |
| `getUserRoleStatsAction` | `@/modules/user` | `src/hooks/users/useUserStats.ts` |
| `checkBrowserSupport` | `@/modules/notification/utils` | `usePushNotifications.ts`, `useUserNotification.ts` |
| `validateHTTPS` | `@/modules/notification/utils` | `usePushNotifications.ts`, `useUserNotification.ts` |
| `getCurrentPermission` | `@/modules/notification/utils` | `usePushNotifications.ts`, `useUserNotification.ts` |

---

## Packages npm manquants

| Package | Consommateur(s) |
|---|---|
| `use-sound` | `src/components/design/prim/skiper25.tsx` |
| `slugify` | `src/services/organization/utils.ts` |

---

## Erreurs secondaires (cascade depuis manquants)

Ces erreurs disparaîtront automatiquement une fois les fichiers ci-dessus fournis :

- `src/components/auth/principal/SignupPrincipal.tsx` — `useActionState` signature
- `src/components/auth/responsable/SignupMainOrg.tsx` — `useActionState` signature  
- `src/hooks/invitation/useInvitationActions.ts` — `result` of type `unknown` (lignes 60, 62, 87, 90, 94, 130, 131)
- `src/hooks/data/userFunctions/useUserFunctions.ts` — `res` of type `unknown` (lignes 75, 85)
- `src/hooks/teacher/useTeacherActions.ts` — `result` of type `unknown` (lignes 24, 54, 82)
- `src/components/planning/hook/usePlanningEvents.ts` — `../types` manquant + `ERRORS.SCHEDULE`

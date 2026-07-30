# Service `invite`

## Rôle

Gestion du cycle de vie des invitations : envoi par email (Supabase Auth admin API),
acceptation avec création du profil rôle, et consultation des invitations org.

## Fichiers

| Fichier | Rôle |
|---|---|
| `actions/invite.mutations.ts` | `sendInviteAction`, `acceptInviteAction`, `resendInvitationAction`, `generateMagicLinkAction`, `deleteInvitationUserAction` |
| `actions/invite.queries.ts` | `getInviteByTokenAction`, `getOrgInvitesAction` |
| `database/invite.mutations.ts` | `createInvitation`, `completeInvite` (transaction), `createRoleProfile` |
| `database/invite.queries.ts` | `getInviteByToken`, `getOrgInvites` |
| `validation.ts` | `sendInviteSchema`, `acceptInviteSchema`, `INVITABLE_ROLES`, `VALID_EXPIRES_DAYS` |
| `types.ts` | `InviteDetails` (union discriminée par rôle), `InvitedBy`, DTOs |
| `core.ts` | `generateInviteToken(expiresInDays?)`, `sendSupabaseInviteEmail(email, token)` |
| `notifications.ts` | `notifyInvitationStakeholders` — fire-and-forget push (stub jusqu'à impl. push) |
| `direction/actions.ts` | `inviteDirectionAction` |
| `direction/database.ts` | `checkFunctionsExist(names, orgId)` |
| `direction/validation.ts` | `inviteDirectionSchema` |
| `direction/types.ts` | `InviteDirectionParams` |
| `student/actions.ts` | `inviteStudentAction`, `getClassInvitesAction` |
| `student/database.ts` | `checkInvitationResources`, `getClassInvitations` |
| `student/validation.ts` | `inviteStudentSchema` |
| `student/types.ts` | `InviteStudentParams` |
| `parent/actions.ts` | `inviteParentAction` |
| `parent/validation.ts` | `inviteParentSchema` |

## Flow invitation

### Flow générique (TEACHER)
1. **DIRECTION** appelle `sendInviteAction({ email, role, expiresInDays? })` → token via `core.generateInviteToken`, `createInvitation` DB avec `details: { role, invited_by }`, `sendSupabaseInviteEmail` Supabase
2. L'invité clique le lien → `/auth/callback?inviteToken=...`
3. **L'invité** appelle `acceptInviteAction({ token, firstName?, lastName? })` → `completeInvite` transaction + `setUserInfo` snapshot Supabase

### Flows rôle-spécifiques
- **DIRECTION** → `inviteDirectionAction({ email, functions, expiresInDays? })` — stocke `function`, `additionalFunctions` dans `details`
- **STUDENT** → `inviteStudentAction({ email, classId, groupIds?, ... })` — stocke `enrollment` dans `details`, `resourceId=classId`
- **PARENT** → `inviteParentAction({ email, studentId, relation, ... })` — stocke `parentLink` dans `details`, `resourceId=studentId`

Ces trois flows utilisent `auth/members/completeSignup` (pas `acceptInviteAction`) pour la création de profil complète.

## Invariants

- `orgId` de toute action d'envoi vient du token (`user.organization.id`) — RULE-USR-001
- `orgId` de `acceptInviteAction` vient du record Invitation DB — **exception RULE-USR-001 documentée** : l'invité n'a pas encore d'org dans son token
- `INVITABLE_ROLES = ['TEACHER', 'STUDENT', 'PARENT']` — pour `sendInviteAction` générique uniquement
- `inviteDirectionAction` bypasse `INVITABLE_ROLES` — passe `'DIRECTION' as Role` explicitement
- `completeInvite` est idempotent (upserts) — relancer en cas d'erreur réseau est sûr
- `deleteInvitationUserAction` — guard : refus si `UserOrganization` actif trouvé

## Points d'extension (⚠ par projet)

- `validation.ts` → `INVITABLE_ROLES` : ajouter/retirer des rôles invitables pour le flow générique
- `database/invite.mutations.ts` → `createRoleProfile` : un `case` par rôle portant un profil DB
- `direction/database.ts` → `checkFunctionsExist` : brancher sur `invite/cache.ts` (système cache V2) — actuellement Prisma direct sans cache
- `notifications.ts` → `sendPushNotificationToUserById` est un stub — fonctionnel quand `services/notification/` sera implémenté

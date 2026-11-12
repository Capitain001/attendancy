# Module Invitation — CLAUDE.md

Documentation détaillée : [`docs/techs/auth/invitations-emission.md`](../../../../docs/techs/auth/invitations-emission.md) et [`docs/techs/auth/invitations-acceptance.md`](../../../../docs/techs/auth/invitations-acceptance.md).

## Rôle

Émet, relance et révoque les invitations d'utilisateurs (`TEACHER`, `STUDENT`, `PARENT`, `DIRECTION`, `GUEST`) en coordonnant Supabase Auth, Prisma (`Invitation`, `AuditLog`) et le service de notifications internes.

## Entrée principale

[`inviteUser(params)`](./user.ts) — orchestrateur unique. Ne jamais appeler les sous-services directement depuis un appelant externe.

```ts
inviteUser(params: InvitationParams): Promise<InvitationResult>
// params: { email, role, adminFunction?, expiresInDays?, deliveryMethod?, resourceId?, resourceType?, details?, ... }
```

### Flow `inviteUser`

1. `getUserInfo()` + `getAuthorization(user, ["DIRECTION", "TEACHER"])`
2. `generateInvitationToken(params.expiresInDays)`
3. Lookup `prisma.user` par email insensible à la casse (`existingUser` $\rightarrow$ `userStatus = "ACTIVE"` ou `"NEW"`)
4. `generateInvitationMetadata(...)` (objet complet destiné à `prisma.invitation.details`)
5. **Remise selon `deliveryMethod` (`"email"` par défaut | `"link"`) et `existingUser`** :
   - `deliveryMethod === "link"` : `generateMagicLink` si `existingUser`, sinon `createInvitationLink` (avec `pickInviteUserMetadata`).
   - `deliveryMethod === "email"` et `!existingUser` : `sendSupabaseInvitation` (email Supabase avec `pickInviteUserMetadata`).
   - `deliveryMethod === "email"` et `existingUser` : **aucun appel Supabase Auth** — la remise se fait par notification Inbox interne à l'étape 6.
6. `saveInvitationWithAudit(...)` : transaction atomique (`Invitation` + `AuditLog` + `createInvitationNotification` si `targetUserId` est présent, suivie de `invalidateEvent("NOTIFICATION_CREATED", targetUserId)` post-commit).

## Fonctions & Fichiers clés

### `token.ts`
- `generateInvitationToken(expiresInDays?: number)` : whitelist `[1, 3, 7, 14, 30]` (défaut `7`), token hex de 64 caractères (`randomBytes(32)`).

### `metadata.ts` & `supabase.ts`
- `generateInvitationMetadata(params, user, token, userStatus)` : construit les métadonnées complètes stockées dans `Invitation.details`.
- `pickInviteUserMetadata(metadata)` (`supabase.ts`) : **filtre strictement sur `USER_METADATA_KEYS`** (`name`, `invited_by`, `invitationToken`, `invitationType`). Les clés d'accès (`role`, `function`, `status`, `organization`) ne sont **jamais** envoyées dans `user_metadata` Supabase ; elles sont posées dans `app_metadata` uniquement à l'acceptation depuis la ligne `Invitation` en base.
- `resendInvitation(email, metadata?)` : recherche l'utilisateur via `findAuthUserByEmail` (RPC) ; s'il est non confirmé, renvoie l'email et persiste le nouveau `invitationToken` via `saveInviteMetadata` (`updateUserMetadata`).
- `generateMagicLink(email, metadata?)` : met à jour `user_metadata` via `saveInviteMetadata` avant d'appeler `generateLink({ type: 'magiclink' })`.
- `createInvitationLink(email, metadata)` : crée le compte invité sans envoyer d'email via `generateLink({ type: 'invite' })`.

### `database.ts` & `server.ts`
- `saveInvitationWithAudit(params)` : transaction atomique (`tx.invitation.create` + `tx.auditLog.create` + `createInvitationNotification` si `targetUserId`).
- `revokePendingInvitationsForResource(tx, params)` (exposé par `server.ts`) : révoque dans la transaction d'acceptation les autres invitations `PENDING` non expirées pour le même `(orgId, email, resourceType, resourceId)`.
- `getOrganizationInvitations({ orgId, limit, role })`, `getInvitationStats(orgId)`, `updateInvitationToken(invitationId, token, expiresAt, orgId)`.

### `actions.ts` (Server Actions de gestion)
- `resendInvitationAction(invitation)` :
  - Si le destinataire existe dans `prisma.user` (`recipientId`) : prolonge `expiresAt` et appelle `upsertInvitationNotification` dans l'inbox interne (sans appel Supabase).
  - Sinon : régénère le token, appelle `resendInvitation` (Supabase) et met à jour la ligne via `updateInvitationToken`.
- `generateMagicLinkAction(invitation)` : régénère le token, met à jour la base et génère le magic link.
- `deleteInvitationUserAction(invitation)` : passe l'invitation en `REVOKED` (`usedAt`), met à jour la notification Inbox (`REVOKED`), puis nettoie en arrière-plan (`after()`) le compte Supabase Auth uniquement s'il est non confirmé, sans `prisma.user` et sans autre invitation `PENDING` active.
- `getInvitationStatsAction()`, `getOrgInvitationsAction()`.

### `policy.ts` & `status.ts`
- `Invitation.status` est la source de vérité : `ACCEPTED`, `DECLINED`, `REVOKED` sont des états terminaux (`usedAt` renseigné) ; `PENDING` avec `expiresAt <= now` est résolu en `expired` côté UI sans écriture DB. Les listes UI excluent `REVOKED`.

### `notifications.ts`
- `notifyInvitationStakeholders({ invitationId, orgId, actorId, event, invitedEmail, classId? })` : notifie en fire-and-forget (`CREATED`, `RESENT`, `LINK_GENERATED`) l'auteur et les membres `DIRECTION` (`PRINCIPAL` / `SECRETARY`).

## Sous-services par rôle

- [`student/`](./student/index.ts) — `inviteStudent`, `getClassInvitationsAction`, `checkInvitationResources`. `getClassInvitationsAction` accepte un filtre `statuses` optionnel; sans filtre, elle retourne tous les statuts sauf `REVOKED`. Les invitations `PENDING` expirées restent distinguées côté UI. Pour une invitation étudiant de classe, **`resourceId` avec `resourceType: "CLASS"` est la seule source de vérité du `classId`** lors de l'acceptation (`details.enrollment` ne sert qu'aux `groupIds` et `parentEmail`).
- [`direction/`](./direction/index.ts) — `inviteDirection`, `checkFunctionsExist`, `getFunctionsByNames`.
- [`teacher/`](./teacher/invite.ts) — `inviteTeacher`.

## Contraintes

- Toujours passer par `inviteUser()` — RBAC + token + audit + notification inbox centralisés.
- Ne jamais séparer les écritures de `saveInvitationWithAudit`.
- Ne jamais envoyer de clés d'accès (`role`, `function`, `organization`) dans `user_metadata` Supabase (toujours filtrer via `pickInviteUserMetadata`).
- Notifications aux parties prenantes : `void notifyInvitationStakeholders(...)` — ne jamais `await` dans le flux principal.

# Service Invitation — Contexte

## Rôle
Invite utilisateur via Supabase Auth + persiste invitation/audit via Prisma. Orchestre token, métadonnées, envoi, log.

## Entrée principale
[`inviteUser(params)`](user.ts) — orchestrateur. Ne jamais appeler les sous-services directement depuis un caller externe.

```ts
inviteUser(params: InvitationParams): Promise<InvitationResult>
// params: { email, role, adminFunction?, expiresInDays?, resourceId?, resourceType?, ... }
```

Flow: `getUserInfo` → `getAuthorization(user, ["DIRECTION","TEACHER"])` → `generateInvitationToken` → `generateInvitationMetadata` → `sendSupabaseInvitation` → `saveInvitationWithAudit`.

## Fonctions clés

### token.ts
```ts
generateInvitationToken(expiresInDays?: number): Promise<{ token: string; expiresAt: Date }>
// expiresInDays whitelist: [1,3,7,14,30]. Défaut: 7. Token = randomBytes(32).hex
```

### metadata.ts
```ts
generateInvitationMetadata(
  params: { email, name?, role, function?, permissions?, departmentId?, resources? },
  user: UserInfo,
  token: string
): InvitationMetadata
// Construit organization + invited_by + status="PENDING" + invitationType="INVITE_ONLY"
```

### invitation.ts
```ts
sendSupabaseInvitation(email: string, metadata: InvitationMetadata)
  : Promise<{ success: true } | { success: false; error: string }>
// supabase.auth.admin.inviteUserByEmail avec redirectTo = INVITE_URL
```

### database.ts
```ts
saveInvitationWithAudit(params: SaveInvitationParams)
// params: { email, token, expiresAt, metadata, inviterUserId, action, resourceId?, resourceType?, targetUserId? }
// ATOMIQUE — prisma.$transaction (invitation + auditLog + notification si targetUserId). Ne jamais séparer les writes.

revokePendingInvitationsForResource(tx, params)
// Révoque dans la transaction d'acceptation les autres invitations PENDING
// encore valides pour le même email, orgId et couple (resourceType, resourceId).

getOrganizationInvitations(orgId: string, limit = 25)
getInvitationStats(orgId: string): { total, pending, expired, accepted, revoked }
updateInvitationToken(invitationId, token, expiresAt, resendLinkBy?)
```

### server.ts
Point d'entrée serveur pour exposer les mutations transactionnelles du module
sans les ajouter au barrel client. L'acceptation inbox conserve l'invitation
choisie en `ACCEPTED` et passe ses doublons actifs de même ressource à `REVOKED`
dans la même transaction; leurs notifications inbox sont mises à jour en conséquence.

### supabase.ts (resend / magic link)
```ts
resendInvitation(email, metadata?)   // renvoie si user non confirmé, sinon erreur
generateMagicLink(email, metadata?)  // génère action_link pour user déjà actif
```
Logique: liste users → non-existant ou non confirmé → `inviteUserByEmail`. Confirmé → utiliser `generateMagicLink`.

### actions.ts (server actions)
```ts
resendInvitationAction(invitation: InvitationListItem)
generateMagicLinkAction(invitation: InvitationListItem)
deleteInvitationUserAction(invitation: InvitationListItem)
getInvitationStatsAction()
```
Renvoient `InvitationActionResult`. Pour étudiants: déclenchent `notifyInvitationStakeholders` (fire-and-forget).

### policy.ts / status.ts
```ts
resolveInvitationUiStatus(invitation, now): "pending" | "accepted" | "expired" | "declined" | "revoked"
resolveInvitationStatus(invitation) // adaptateur UI
filterInvitationsByStatus(list, status)
calculateInvitationStats(list)
getStatusBadgeInfo(status)
```
`Invitation.status` est la source de vérité : `ACCEPTED`, `DECLINED`, `REVOKED` sont
des états terminaux ; `PENDING` + `expiresAt < now` est affiché comme `expired`
sans persister un état d'expiration. `details` ne porte pas l'état du cycle de vie.
`usedAt` est écrit à chaque transition terminale. `userId` peut être associé
dès la création de l'invitation destinée à un compte existant, pour sa notification inbox.
Les listes UI excluent `REVOKED`.
Une révocation utilisateur est persistée avant le nettoyage Auth et ne dépend pas de son succès.

### notifications.ts
```ts
notifyInvitationStakeholders({ invitationId, orgId, actorId, event, invitedEmail, classId? })
// event: "CREATED" | "RESENT" | "LINK_GENERATED"
// Notifie actor + DIRECTION (PRINCIPAL/SECRETARY). Erreurs absorbées.
```

## Sous-services par rôle
- [`student/`](student/index.ts) — `inviteStudent`, `getClassInvitationsAction`, `checkInvitationResources`
- [`direction/`](direction/index.ts) — `inviteDirection`, `checkFunctionsExist`, `getFunctionsByNames`
- [`teacher/`](teacher/invite.ts) — invitation enseignant

Chacun valide ses params via Valibot (`*/validation.ts`), enrichit metadata, puis délègue à `inviteUser`.

## Contraintes
- Toujours passer par `inviteUser()` — RBAC + token + audit centralisés.
- `saveInvitationWithAudit` est atomique → ne pas appeler `saveInvitationToDatabase` + `logAuditAction` séparément.
- `expiresInDays` doit ∈ `[1,3,7,14,30]`, sinon fallback 7.
- Resend/magic link → re-générer token via `generateInvitationToken` + `updateInvitationToken` avant envoi Supabase.
- Notifications: `void notifyInvitationStakeholders(...)` — ne jamais await dans flow principal.
- Audit log: `resource: "USER"`, `resourceId = invitation.id`.

## Types clés
- `InvitationParams`, `InvitationResult`, `InvitationMetadata`, `SupabaseInviteData` → `@/types/invitation`
- `InvitationListItem`, `InvitationStats` → `database.ts`
- `Action`, `Resource` → `@prisma/client`

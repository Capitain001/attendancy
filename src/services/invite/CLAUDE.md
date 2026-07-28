# Service `invite`

## Rôle

Gestion du cycle de vie des invitations : envoi par email (Supabase Auth admin API),
acceptation avec création du profil rôle, et consultation des invitations org.

## Fichiers

| Fichier | Rôle |
|---|---|
| `actions/invite.mutations.ts` | `sendInviteAction`, `acceptInviteAction` |
| `actions/invite.queries.ts` | `getInviteByTokenAction`, `getOrgInvitesAction` |
| `database/invite.mutations.ts` | `createInvitation`, `completeInvite` (transaction), `createRoleProfile` |
| `database/invite.queries.ts` | `getInviteByToken`, `listOrgInvites` |
| `validation.ts` | `sendInviteSchema`, `acceptInviteSchema` + InferInput/Output |
| `types.ts` | `InviteDetails`, DTOs |

## Flow invitation

1. **DIRECTION** appelle `sendInviteAction({ email, role })` → token UUID généré,
   `createInvitation` DB, `admin.auth.inviteUserByEmail` Supabase avec `redirectTo` contenant le token
2. L'invité clique le lien, s'authentifie via Supabase, arrive sur `/auth/callback?inviteToken=...`
3. **L'invité** appelle `acceptInviteAction({ token, firstName?, lastName? })` →
   `completeInvite` transaction (User upsert + UserOrganization + profil rôle + AuditLog) +
   `setUserInfo` snapshot Supabase

## Invariants

- `orgId` de `sendInviteAction` vient du token (`user.organization.id`) — RULE-USR-001
- `orgId` de `acceptInviteAction` vient du record Invitation DB — **exception RULE-USR-001 documentée** :
  l'invité n'a pas encore d'org dans son token. L'email match garantit l'ownership.
- Rôles invitables : `TEACHER | STUDENT | PARENT` — jamais `DIRECTION` ou `ADMIN` via ce flow.
- `completeInvite` est idempotent (upserts) — relancer en cas d'erreur réseau est sûr.

## Points d'extension (⚠ par projet)

- `validation.ts` → `INVITABLE_ROLES` : ajouter/retirer des rôles invitables
- `database/invite.mutations.ts` → `createRoleProfile` : un `case` par rôle portant un profil DB
- `database/invite.mutations.ts` → `createInvitation` → champ `details` : enrichir avec
  `departmentId`, `functionName`, etc. selon les besoins du flow invitation complet

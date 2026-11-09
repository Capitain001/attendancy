# Émission & Cycle de Vie des Invitations (`src/modules/invitation`)

Ce document couvre la création, l'envoi, la relance et la révocation des invitations émises par un membre `DIRECTION` ou `TEACHER` pour ajouter un utilisateur (`TEACHER`, `STUDENT`, `PARENT`, `DIRECTION`, `GUEST`) à une organisation.

Pour le flux côté destinataire (acceptation ou refus), voir [`invitations-acceptance.md`](./invitations-acceptance.md).

---

## 1. Architecture d'Émission (`inviteUser`)

L'unique point d'entrée d'émission est [`inviteUser(params)`](../../../apps/web/src/modules/invitation/user.ts). Les sous-modules par rôle (`student/`, `teacher/`, `direction/`) valident leurs entrées spécifiques avec Valibot puis délèguent systématiquement à `inviteUser()`.

```text
inviteUser(params)  (apps/web/src/modules/invitation/user.ts)
  ├─ 1. getUserInfo() + getAuthorization(user, ["DIRECTION", "TEACHER"])
  ├─ 2. generateInvitationToken(expiresInDays) → token (64 hex chars) + expiresAt (1|3|7|14|30j, défaut 7j)
  ├─ 3. Lookup prisma.user par email (insensible à la casse) :
  │       existingUser ? userStatus = "ACTIVE" : userStatus = "NEW"
  ├─ 4. generateInvitationMetadata(...) → construit le payload complet pour la base
  │
  ├─ 5. Remise selon deliveryMethod ("email" par défaut | "link") et existingUser :
  │    ├─ Mode "link" :
  │    │    ├─ existingUser présent → generateMagicLink(email, metadata)
  │    │    └─ existingUser absent  → createInvitationLink(email, metadata)
  │    └─ Mode "email" :
  │         ├─ existingUser absent  → sendSupabaseInvitation(email, metadata) (email Supabase Auth)
  │         └─ existingUser présent → AUCUN appel Supabase Auth (remise par notification Inbox à l'étape 6)
  │
  └─ 6. saveInvitationWithAudit(...)  (Transaction Prisma atomique)
       ├─ tx.invitation.create({ ..., userId: existingUser?.id, resourceId, resourceType })
       ├─ tx.auditLog.create({ action: CREATE, resource: "USER", resourceId: invitation.id })
       └─ Si existingUser?.id :
            createInvitationNotification(tx, { userId: existingUser.id, source: ... })
            + post-commit : invalidateEvent("NOTIFICATION_CREATED", existingUser.id)
```

---

## 2. Cloisonnement des Métadonnées lors de l'Envoi Supabase

Fichiers : [`apps/web/src/modules/invitation/metadata.ts`](../../../apps/web/src/modules/invitation/metadata.ts) et [`apps/web/src/modules/invitation/supabase.ts`](../../../apps/web/src/modules/invitation/supabase.ts)

1. **`generateInvitationMetadata()`** construit l'objet `InvitationMetadata` complet (incluant `role`, `function`, `organization`, `invited_by`, `invitationToken`, `details.enrollment`, `details.parentLink`). Cet objet complet est persisté **uniquement en base de données** dans `prisma.invitation.details`.
2. **`pickInviteUserMetadata(metadata)`** filtre ce payload avant tout appel à Supabase Auth (`inviteUserByEmail` ou `generateLink`) pour ne conserver que les clés de `USER_METADATA_KEYS` :
   - `name`
   - `invited_by`
   - `invitationToken`
   - `invitationType` (`"INVITE_ONLY"`)
3. **Invariant de sécurité** : `role`, `function`, `status` et `organization` ne sont **jamais** envoyés dans `user_metadata` Supabase. Ils seront écrits dans `app_metadata` par le serveur uniquement au moment où l'invité accepte l'invitation.

---

## 3. Cycle de Vie et Statuts d'une Invitation

Fichiers : [`apps/web/src/modules/invitation/policy.ts`](../../../apps/web/src/modules/invitation/policy.ts) et [`status.ts`](../../../apps/web/src/modules/invitation/status.ts)

La colonne `Invitation.status` en base est l'unique source de vérité :

| Statut DB (`InvitationStatus`) | Condition | Statut UI (`resolveInvitationUiStatus`) | Nature |
|---|---|---|---|
| `PENDING` | `expiresAt === null` ou `expiresAt > now` | `pending` | Actif |
| `PENDING` | `expiresAt <= now` | `expired` (calculé à la volée, non persisté) | Expiré |
| `ACCEPTED` | `usedAt` renseigné | `accepted` | Terminal |
| `DECLINED` | `usedAt` renseigné (refusé par l'invité) | `declined` | Terminal |
| `REVOKED` | `usedAt` renseigné (annulé par l'émetteur ou par doublon de ressource) | `revoked` (exclu des listes UI par défaut) | Terminal |

> **Source de vérité pour l'inscription étudiant (`STUDENT`) :**
> Lorsqu'une invitation cible une classe, `invitation.resourceId` avec `invitation.resourceType === "CLASS"` est la seule source de vérité du `classId` lors de l'acceptation. `details.enrollment` fournit uniquement les options complémentaires (`groupIds`, `parentEmail`).

---

## 4. Actions de Gestion Post-Émission (`src/modules/invitation/actions.ts`)

Fichier : [`apps/web/src/modules/invitation/actions.ts`](../../../apps/web/src/modules/invitation/actions.ts)

### A. Relancer une invitation (`resendInvitationAction`)

Opère uniquement sur une invitation `PENDING` de l'organisation courante :

- **Cas 1 — Destinataire déjà existant dans `prisma.user` (`recipientId` trouvé)** :
  - Génère une nouvelle date `expiresAt` (`generateInvitationToken()`).
  - Dans une transaction Prisma : met à jour `invitation.expiresAt` (et `userId` si manquant) puis appelle `upsertInvitationNotification(tx, { userId: recipientId, source })` pour rafraîchir/remonter la notification dans l'inbox interne de l'utilisateur.
  - Invalide `NOTIFICATION_CREATED` pour `recipientId`. **Aucun appel Supabase Auth n'est effectué.**
- **Cas 2 — Nouvel utilisateur externe (`recipientId` absent)** :
  - Génère un nouveau couple `{ token, expiresAt }`.
  - Appelle `resendInvitation(email, { invitationToken: token })` :
    - Si le compte Auth existe déjà mais n'a pas confirmé son email (`!user.email_confirmed_at`), Supabase ignore le champ `data` de `inviteUserByEmail` : `resendInvitation` appelle donc explicitement `saveInviteMetadata` (`updateUserMetadata`) pour persister le nouveau `invitationToken` dans `user_metadata`.
  - Met à jour la ligne en base via `updateInvitationToken(id, token, expiresAt, orgId)`.

### B. Générer un lien magique (`generateMagicLinkAction`)

- Génère un nouveau `{ token, expiresAt }` et met à jour la ligne `Invitation` (`updateInvitationToken`).
- Appelle `generateMagicLink(email, { invitationToken: token })` :
  - Met d'abord à jour `user_metadata.invitationToken` via `saveInviteMetadata` (car `supabase.auth.admin.generateLink` ignore `data` si le compte Auth existe déjà).
  - Génère et retourne `action_link` (`redirectTo: INVITE_URL`).

### C. Révoquer une invitation (`deleteInvitationUserAction`)

1. **Transition atomique en base** : passe l'invitation de `PENDING` à `REVOKED` (`usedAt = new Date()`).
2. **Mise à jour de la notification Inbox** : si `invitation.userId` est présent, appelle `setInvitationNotificationStatus(tx, { userId, invitationId, status: "REVOKED" })` et invalide `NOTIFICATION_READ`.
3. **Nettoyage différé du compte Supabase Auth (`after()`)** : en arrière-plan après la réponse HTTP, supprime le compte Supabase Auth (`deleteAuthUser`) **uniquement si** :
   - le compte Auth n'a jamais confirmé son email (`!authUser.email_confirmed_at`),
   - aucun enregistrement `prisma.user` ne correspond à cet ID ou email,
   - aucune autre invitation `PENDING` non expirée n'existe pour cet email.

### D. Notifications aux parties prenantes (`notifyInvitationStakeholders`)

Fichier : [`apps/web/src/modules/invitation/notifications.ts`](../../../apps/web/src/modules/invitation/notifications.ts)

Pour les invitations d'étudiants (`CREATED`, `RESENT`, `LINK_GENERATED`), `void notifyInvitationStakeholders(...)` notifie en fire-and-forget l'auteur de l'action ainsi que les membres `DIRECTION` ayant la fonction `PRINCIPAL` ou `SECRETARY`.


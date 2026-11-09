# Acceptation & Refus d'Invitation (Lien Externe vs Inbox Interne)

Lorsqu'un utilisateur est invité à rejoindre une organisation, deux parcours d'acceptation coexistent selon son canal d'entrée :
1. **Parcours Lien Externe (`/auth/invite` $\rightarrow$ `/auth/welcome` $\rightarrow$ `completeSignup`)** : pour un nouvel utilisateur qui clique sur l'email Supabase ou un utilisateur qui ouvre un lien d'invitation/magic link.
2. **Parcours Inbox Interne (`acceptInboxInvitationAction` / `declineInboxInvitationAction`)** : pour un utilisateur disposant déjà d'un compte applicatif qui reçoit et traite l'invitation directement depuis ses notifications internes.

Les deux parcours partagent les mêmes primitives d'adhésion idempotentes dans [`apps/web/src/modules/auth/members/utils.ts`](../../../apps/web/src/modules/auth/members/utils.ts).

---

## 1. Parcours A — Via Lien d'Invitation (`/auth/invite` & `completeSignup`)

```text
Clic sur le lien d'invitation (INVITE_URL = /auth/invite#access_token=...&refresh_token=...)
  │
  ▼
/auth/invite  (Client Component : InviteRelay — apps/web/src/app/auth/invite/page.tsx)
  ├─ Lit access_token et refresh_token dans window.location.hash
  ├─ supabase.auth.setSession({ access_token, refresh_token })
  └─ router.replace('/auth/welcome')
       │
       ▼
/auth/welcome  (RSC → <NewUserPage user={user} />)
  ├─ Étapes de présentation : WelcomeStep → InvitationStep → RoleStep → ConfirmStep
  │
  ├─ CAS 1 : Nouvel utilisateur (user.status === 'NEW')
  │    └─ Affiche <SignupForm /> → soumet signupMemberAction(formData)
  │         ├─ 1. Valide et définit le mot de passe : supabase.auth.updateUser({ password })
  │         ├─ 2. Lance completeSignup() en arrière-plan (setImmediate)
  │         └─ 3. redirect('/auth/profile') → ProfileStepper (upsertUserProfile + ensureRoleProfile)
  │                 └─ redirect('/{orgSlug}/{role}')
  │
  └─ CAS 2 : Utilisateur déjà inscrit (user.status !== 'NEW', venu par magic link)
       └─ Bouton Accepter → joinOrganizationAction()
            ├─ 1. Exécute completeSignup() de façon synchrone
            ├─ 2. Recharge getUserInfo({ cache: false })
            └─ 3. redirect(redirectUser(updatedUser))
```

### Ce que fait `completeSignup()` (`src/modules/auth/members/complete-signup.ts`)

1. **Vérification d'identité et du jeton** :
   - Lit `user = await getUserInfo()`. Exige `user.id`, `user.email` et `user.invitationToken` (présent dans `user_metadata`).
   - Charge l'invitation `PENDING` en base par `token` (`fetchAndValidateInvitation`), vérifie qu'elle n'est pas expirée et que **`invitation.email.toLowerCase() === user.email.toLowerCase()`** (empêche un utilisateur de consommer le jeton d'un tiers en modifiant son `user_metadata`).
2. **Transaction Prisma (`prisma.$transaction`)** :
   - Upsert `prisma.user` (`status: "ACTIVE"`).
   - Rattache l'utilisateur à l'organisation de façon idempotente via `ensureUserOrganization(tx, { userId, orgId, role })`.
   - Crée ou réactive le profil métier (`Teacher`, `Student`, `Parent`, `Direction`, `Admin`) via `createRoleSpecificEntity(tx, userId, role, orgId, departmentId)`.
   - Assigne la fonction principale (`assignFunctionToUser`) et les éventuelles fonctions additionnelles (`assignMultipleFunctionsToUser`).
   - Si `role === "PARENT"` : crée le lien parent-élève via `ensureParentRelation(tx, ...)`.
   - Si `role === "STUDENT"` : inscrit l'élève dans la classe via `enrollStudentInClass(tx, profile.id, enrollment)` où `enrollment.classId` provient exclusivement de `invitation.resourceId` (lorsque `invitation.resourceType === "CLASS"`).
   - Marque l'invitation comme `ACCEPTED` (`usedAt = acceptedAt`, `userId = createdUser.id`) avec garde `status: "PENDING"` contre les exécutions concurrentes (`P2025`).
3. **Écriture des accès (`app_metadata`)** :
   - Construit l'objet `organization` enrichi du `profileId` (`injectRoleProfileId`) à partir des données de la ligne `Invitation` en base (jamais depuis `user_metadata`).
   - Appelle `setUserAccess({ role, function, status: "ACTIVE", organization, organizations })`.
4. **Audit** : trace `ACCEPT_INVITATION` via `logAuditAsync`.

---

## 2. Parcours B — Via Notification Inbox Interne (`inbox-invitation.ts`)

Lorsqu'un utilisateur possède déjà un compte dans `prisma.user`, l'invitation lui est remise sous forme de notification in-app (`createInvitationNotification`) liée à `invitation.userId`. Il peut l'accepter ou la refuser directement depuis sa boîte de réception, sans passer par un email ni par `/auth/invite`.

**Fichier :** [`apps/web/src/modules/auth/members/inbox-invitation.ts`](../../../apps/web/src/modules/auth/members/inbox-invitation.ts)

### A. Accepter depuis l'Inbox (`acceptInboxInvitationAction({ invitationId })`)

```text
acceptInboxInvitationAction({ invitationId })
  ├─ 1. Validation : getUserInfo() + Valibot UUID + lecture prisma.invitation
  │     (where: { id: invitationId, userId: user.id, status: 'PENDING', non expirée })
  │
  ├─ 2. Transaction atomique prisma.$transaction :
  │    ├─ A. Claim atomique : tx.invitation.update({ where: { id, userId, status: 'PENDING' }, data: { status: 'ACCEPTED', usedAt } })
  │    ├─ B. Révocation des doublons : revokePendingInvitationsForResource(tx, { orgId, email, resourceId, resourceType, acceptedInvitationId })
  │    │     → passe en REVOKED toutes les autres invitations PENDING de même ressource pour cet email/org
  │    ├─ C. Adhésion & profil métier :
  │    │     - ensureUserOrganization(tx, { userId, orgId, role })
  │    │     - createRoleSpecificEntity(tx, userId, role, orgId, departmentId)
  │    │     - assignFunctionToUser / assignMultipleFunctionsToUser
  │    │     - PARENT : ensureParentRelation(tx, ...)
  │    │     - STUDENT : enrollStudentInClass(tx, profile.id, enrollment) (classId = invitation.resourceId si CLASS)
  │    ├─ D. Mise à jour des notifications de l'invité :
  │    │     - setInvitationNotificationStatus(tx, { userId, invitationId, status: 'ACCEPTED' })
  │    │     - pour chaque doublon révoqué : setInvitationNotificationStatus(tx, { ..., status: 'REVOKED' })
  │    └─ E. Notification de réponse à l'émetteur (si senderId présent) :
  │          createInvitationResponseNotification(tx, { userId: senderId, source: { kind: 'INVITATION_ACCEPTED', ... } })
  │
  ├─ 3. Post-commit — Mise à jour de app_metadata (setUserAccess) :
  │    ├─ Ajoute la nouvelle organisation (avec profileId) dans user.organizations
  │    └─ PRÉSERVATION DU CONTEXTE ACTIF :
  │       - Si l'utilisateur a déjà une organisation active (hasActiveOrg === true) :
  │         met uniquement à jour { status: 'ACTIVE', organizations } SANS écraser organization, role ni function courants.
  │       - Sinon (hasActiveOrg === false) :
  │         active immédiatement { status: 'ACTIVE', role, function, organization: orgData, organizations }.
  │
  ├─ 4. Post-commit — Invalidations de cache :
  │    ├─ invalidateEvent('NOTIFICATION_READ', userId) (+ utilisateurs des doublons révoqués)
  │    ├─ invalidateEvent('NOTIFICATION_CREATED', senderId)
  │    └─ Si STUDENT inscrit : invalidateEvent('STUDENT_ENROLLMENT_CREATED', orgId, enrolledClassId)
  │
  └─ 5. Audit (logAuditAsync) + retour { data: { success: true, orgSlug, orgName, redirectPath, warning? } }
```

### B. Refuser depuis l'Inbox (`declineInboxInvitationAction({ invitationId })`)

1. **Mise à jour atomique** : passe `prisma.invitation` de `PENDING` (non expirée, appartenant à `userId`) à `DECLINED` (`usedAt = now`).
2. **Notifications (secondaires, non bloquantes)** :
   - Met à jour la notification de l'invité via `setInvitationNotificationStatus(tx, { userId, invitationId, status: 'DECLINED' })`.
   - Envoie une notification retour à l'émetteur (`senderId`) via `createInvitationResponseNotification(tx, { userId: senderId, source: { kind: 'INVITATION_DECLINED', ... } })`.
3. **Invalidation du cache** : `invalidateEvent('NOTIFICATION_READ', userId)` et `invalidateEvent('NOTIFICATION_CREATED', senderId)`.

---

## 3. Idempotence des Primitives d'Adhésion (`src/modules/auth/members/utils.ts`)

Toutes les fonctions appelées dans la transaction d'acceptation (`completeSignup` comme `acceptInboxInvitationAction`) sont **idempotentes** et supportent la ré-invitation d'un ancien membre :

- **`ensureUserOrganization(tx, { userId, orgId, role })`** (`@/services/user-organization/server`) : crée ou met à jour le rattachement utilisateur-organisation sans erreur de contrainte unique.
- **`createRoleSpecificEntity(tx, userId, role, orgId, departmentId)`** : utilise `upsert` sur `userId_orgId`. Si le profil (`Teacher`, `Student`, `Parent`, `Direction`) avait été désactivé par soft-delete (`deletedAt !== null`), il est **réactivé (`deletedAt: null`)** en conservant son `id` historique.
- **`enrollStudentInClass(tx, studentId, enrollment)`** : délègue à `createStudentEnrollmentRaw` (`@/services/student-enrollment/database`) qui réouvre une inscription clôturée (`endedAt`) ou en crée une nouvelle, et ajoute les `groupIds` avec `skipDuplicates: true`.
- **`ensureParentRelation(tx, ...)`** (`@/services/parent-relation/server`) : garantit le lien parent-élève sans doublon.


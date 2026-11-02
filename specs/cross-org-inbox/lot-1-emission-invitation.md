# Lot 1 — Émission d'Invitation & Notification Interne

> **Statut :** En cours de revue / En attente de validation  
> **Objectif :** Permettre d'inviter un utilisateur déjà inscrit (`ACTIVE`) sans passer par l'API Supabase email, et lui déposer une notification in-app dans sa boîte de réception.

---

## Fichiers impliqués dans ce lot

- **Orchestrateur d'invitation :** [inviteUser(params)](../../apps/web/src/modules/invitation/user.ts#L19) — `apps/web/src/modules/invitation/user.ts`
- **Persistance DB & Audit :** [saveInvitationWithAudit(...)](../../apps/web/src/modules/invitation/database.ts#L84) — `apps/web/src/modules/invitation/database.ts`
- **Types du module :** [InvitationParams / InvitationMetadata](../../apps/web/src/types/invitation.ts) — `apps/web/src/types/invitation.ts`
- **Service Notification (création in-app) :** [createUserNotification(...)](../../apps/web/src/services/notification/database/notification.mutations.ts#L8) — `apps/web/src/services/notification/database/notification.mutations.ts`
- **Documentation de référence du flow :** [docs/auth/flow/invite.md](../../docs/auth/flow/invite.md#L58) — `docs/auth/flow/invite.md`

---

## 1. Analyse de l'existant

### 1.2 Problèmes identifiés dans l'implémentation précédente
1. **Sémantique erronée (`existingProfile`)** :
   - `prisma.user.findUnique({ where: { email } })` charge un enregistrement de la table `User` (compte global).
   - Dans le projet, un "Profile" désigne spécifiquement une entité métier par rôle (`Teacher`, `Student`, `Direction`, `Parent`).
   - Le nom `existingProfile` induit en erreur. Il doit être nommé `existingUser` ou `targetUser`.
2. **Signature fragile à arguments positionnels multiples** :
   - `saveInvitationWithAudit` accumule 9 arguments positionnels :
     ```ts
     saveInvitationWithAudit(email, token, expiresAt, metadata, userId, action, resourceId, resourceType, targetUserId)
     ```
   - Le 5ème paramètre (`userId`) représente l'**émetteur** (`inviterId` pour l'AuditLog).
   - Le 9ème paramètre représente le **destinataire** (`invitedUserId` pour `Invitation.userId`).
3. **Séparation des responsabilités (Invitation vs Notification)** :
   - Faut-il créer la notification dans la transaction de l'invitation (atomicité DB) ou l'émettre explicitement via le service `notification` ?
   - Recommandation : Soit un helper de transaction dédié qui persiste explicitement l'invitation + notification ensemble, soit l'appel propre via le service notification.

---

## 2. Propositions d'implémentation

### Option A (Recommandée) : Paramètres typés et séparation claire

#### A.1 `apps/web/src/modules/invitation/database.ts`
Remplacer la longue liste d'arguments positionnels par une interface propre `SaveInvitationParams` :

```typescript
export interface SaveInvitationParams {
  email: string;
  token: string;
  expiresAt: Date;
  metadata: InvitationMetadata;
  inviterUserId: string;
  action: Action;
  resourceId?: string;
  resourceType?: Resource;
  targetUserId?: string; // ID de l'utilisateur existant si déjà inscrit
}

export async function saveInvitationWithAudit(
  params: SaveInvitationParams
): Promise<{ invitation: any; auditLog: any; notification?: any }> {
  const invitationDetails = createDatabaseDetails(params.metadata);
  const auditDetails = createAuditDetails(params.email, params.metadata);

  return await prisma.$transaction(async (tx) => {
    // 1. Création de l'invitation
    const invitation = await tx.invitation.create({
      data: {
        email: params.email,
        token: params.token,
        expiresAt: params.expiresAt,
        orgId: params.metadata?.organization?.id!,
        invitationType: "INVITE_ONLY",
        role: params.metadata?.role,
        details: invitationDetails,
        ...(params.targetUserId ? { userId: params.targetUserId } : {}),
        ...(params.resourceId ? { resourceId: params.resourceId } : {}),
        ...(params.resourceType ? { resourceType: params.resourceType } : {}),
      },
    });

    // 2. Traçabilité (Audit Log)
    const auditLog = await tx.auditLog.create({
      data: {
        userId: params.inviterUserId,
        action: params.action,
        resourceId: invitation.id || undefined,
        resource: "USER",
        details: auditDetails,
      },
    });

    // 3. Notification in-app pour utilisateur existant
    let notification;
    if (params.targetUserId) {
      const orgName = params.metadata?.organization?.name || "une organisation";
      const roleLabel = params.metadata?.role || "membre";

      notification = await tx.notification.create({
        data: {
          userId: params.targetUserId,
          type: "INVITATION",
          message: `Vous avez été invité à rejoindre ${orgName} en tant que ${roleLabel}.`,
          metadata: {
            invitationId: invitation.id,
            invitationToken: params.token,
            orgId: params.metadata?.organization?.id,
            orgName,
            orgSlug: params.metadata?.organization?.slug,
            role: params.metadata?.role,
            resourceType: params.resourceType,
            resourceId: params.resourceId,
            senderName: params.metadata?.invited_by?.name || "Un administrateur",
            expiresAt: params.expiresAt.toISOString(),
            status: "PENDING",
          },
        },
      });
    }

    return { invitation, auditLog, notification };
  }, {
    maxWait: 10000,
    timeout: 20000,
  });
}
```

#### A.2 `apps/web/src/modules/invitation/user.ts` (Orchestrateur)

```typescript
// Étape 4 : Vérification du compte cible (User existant ou Nouveau)
const existingUser = await prisma.user.findUnique({
  where: { email: params.email },
  select: { id: true, email: true },
});
const userStatus: UserStatus = existingUser ? "ACTIVE" : "NEW";

// Étape 5 : Métadonnées
const metadata = generateInvitationMetadata(
  { ...params, function: params.adminFunction },
  user,
  token,
  userStatus
);

// Étape 6 : Remise de l'invitation
const deliveryMethod = params.deliveryMethod ?? "email";
let invitationLink: string | undefined;

if (deliveryMethod === "link") {
  // Génération du lien direct (Magic Link si existant, Lien d'invite standard sinon)
  const linkResult = existingUser
    ? await generateMagicLink(params.email, metadata)
    : await createInvitationLink(params.email, metadata);

  if (!linkResult.success) {
    return { error: linkResult.error || "Erreur Supabase" };
  }
  invitationLink = linkResult.link;
} else {
  // Mode email :
  // - Utilisateur non inscrit (NEW) : Supabase inviteUserByEmail (Flow historique)
  // - Utilisateur actif (ACTIVE) : Pas d'appel Supabase (qui échouerait). L'invitation est déposée in-app dans sa boîte.
  if (!existingUser) {
    const invitationResult = await sendSupabaseInvitation(params.email, metadata);
    if (!invitationResult.success) {
      return { error: invitationResult.error || "Erreur Supabase" };
    }
  }
}

// Étape 7 : Persistance atomique
const result = await saveInvitationWithAudit({
  email: params.email,
  token,
  expiresAt,
  metadata,
  inviterUserId: user.id!,
  action: Action.CREATE,
  resourceId: params.resourceId,
  resourceType: params.resourceType,
  targetUserId: existingUser?.id,
});
```

---

## 3. Points à valider ensemble
1. **L'objet de paramètres `SaveInvitationParams`** : Valides-tu le passage à des paramètres nommés pour éviter les 9 arguments positionnels ?
2. **Renommage `existingProfile` → `existingUser`** : Clarification sémantique validée ?
3. **Création atomique de la notification dans la transaction** : Garde-t-on la création de la ligne `Notification` dans `prisma.$transaction` pour garantir qu'une invitation vers un utilisateur actif génère toujours sa notification sans état désynchronisé ?

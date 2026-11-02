# Lot 1 — Brief d'implémentation (décisions actées)

> **Objectif :** inviter un utilisateur déjà inscrit (`ACTIVE`) sans passer par `inviteUserByEmail`, et lui déposer une notification `INVITATION` dans sa boîte in-app.
> **Ce document remplace `lot-1-emission-invitation.md`.** Seules les décisions ci-dessous font foi.
> **Périmètre strict :** ne pas auditer ni refactorer le reste de l'existant.
> **Placement des fichiers :** là où l'organisation exacte n'est pas connue, **l'IA interne positionne les éléments** selon les conventions du projet (skill `service-module-pattern`). Les noms de fichiers/fonctions des extraits ci-dessous sont indicatifs, sauf mention contraire.

---

## 1. Décisions actées

| # | Décision |
|---|---|
| 1 | `saveInvitationWithAudit` passe à un **objet de paramètres nommé** (`SaveInvitationParams`) au lieu de 9 arguments positionnels. |
| 2 | `existingProfile` → `existingUser` (« profile » désigne les entités Teacher/Student/Direction/Parent). |
| 3 | La notification est créée **dans la même `$transaction`** que l'invitation et l'audit, par une **fonction du service `notification`** (propriétaire du modèle `Notification`) qui reçoit le client transactionnel en paramètre **`tx: Tx`**. Pas de `tx.notification.create` écrit en dur dans `modules/invitation/database.ts`. |
| 4 | Un **builder** construit `message` + `metadata` : l'appelant ne compose jamais le message à la main. Il vit dans le service `notification`. |
| 5 | La fonction exige un `tx` (pas de `prisma` direct). Pour une **relance de notification** (on ne recrée pas une invitation non expirée), l'appelant ouvre sa propre `prisma.$transaction` si besoin. |
| 6 | `invalidateEvent('NOTIFICATION_CREATED', targetUserId)` est appelé **après le commit**, jamais dans la transaction. |
| 7 | Utilisateur existant + mode `email` : **aucun appel Supabase**. La remise = la notification. Pas d'email (pas de provider pour l'instant). |
| 8 | Mode `link` : inchangé (`generateMagicLink` si existant, `createInvitationLink` sinon). La notification est créée aussi. |
| 9 | Aucun pré-check ajouté (déjà membre / doublon) : un utilisateur existant n'est pas ré-invité, c'est déjà géré en amont. |
| 10 | **Pas de token** dans `Notification.metadata`. L'autorisation (Lot 2) se fera via `invitation.userId === utilisateur connecté`. |
| 11 | `orgLogo` et `resourceName` **ne sont pas stockés** dans la notification (lus depuis la base à l'affichage, Lot 2). |

### Contraintes de code (convention projet)

- **Jamais de `Promise<...>` explicite** sur les fonctions modifiées ou créées : TS infère.
- **Jamais de `any`** sur ce qu'on modifie. Le retour `{ invitation: any; auditLog: any }` disparaît (inféré).
- Ces règles concernent le code modifié/créé, pas l'existant non touché.
- Convention de transaction : `type Tx = Prisma.TransactionClient` en tête de fichier, paramètre nommé `tx` (comme dans `class.mutations.ts` du service personal : `insertPersonalClass(tx: Tx, …)`).

---

## 2. Service `notification` : builder + création avec `tx`

**Où :** dans le service `notification` (`services/notification/ ou modules/notification`), en respectant son organisation (`database/notification.mutations.ts` pour l'écriture ; builder et types/constantes aux emplacements que l'IA interne juge corrects). **L'IA interne décide du placement exact.**

Extrait de référence :

```ts
import type { Prisma, Resource } from '@/generated/prisma/client'
import type { Role } from '@/types/user'

type Tx = Prisma.TransactionClient

// Source minimale : alimentable depuis l'émission (metadata) ET depuis une relance (ligne Invitation en DB).
export interface InvitationNotificationSource {
  invitationId: string
  expiresAt: Date
  role: Role
  organization: { id: string; name?: string; slug?: string }
  senderName?: string
  resourceId?: string | null
  resourceType?: Resource | null
}

export function buildInvitationNotification(source: InvitationNotificationSource) {
  const orgName = source.organization.name ?? 'une organisation'

  return {
    type: 'INVITATION' as const,
    message: `Vous avez été invité à rejoindre ${orgName} en tant que ${ROLE_LABELS[source.role]}.`,
    metadata: {
      invitationId: source.invitationId,
      orgId: source.organization.id,
      orgName,
      orgSlug: source.organization.slug ?? null,
      role: source.role,
      resourceType: source.resourceType ?? null,
      resourceId: source.resourceId ?? null,
      senderName: source.senderName ?? 'Un administrateur',
      expiresAt: source.expiresAt.toISOString(),
      status: 'PENDING',
    } satisfies Prisma.InputJsonObject,
  }
}

// N'invalide PAS le cache : c'est à l'appelant, après commit (cf. décision 6).
export async function createInvitationNotification(
  tx: Tx,
  params: { userId: string; source: InvitationNotificationSource },
) {
  const { type, message, metadata } = buildInvitationNotification(params.source)

  return tx.notification.create({
    data: { userId: params.userId, type, message, metadata },
    select: { id: true, type: true, message: true, metadata: true, createdAt: true },
  })
}
```

### Libellés de rôle (`ROLE_LABELS`)

Aucun mapping `Role → libellé FR` n'a été confirmé. **Chercher d'abord s'il en existe un** dans le projet et le réutiliser. Sinon le créer là où l'IA interne le juge pertinent :

```ts
export const ROLE_LABELS = {
  ADMIN: 'administrateur',
  TEACHER: 'enseignant',
  STUDENT: 'étudiant',
  PARENT: 'parent',
  DIRECTION: 'membre de la direction',
  GUEST: 'invité',
} as const satisfies Record<Role, string>
```

> `Role` vient de `@/types/user` (rôles DB + `GUEST`), car `InvitationMetadata.role` est de ce type. Si `satisfies` échoue, un rôle de l'union est manquant : l'ajouter.

### ⚠ Point d'architecture à trancher par l'IA interne

`modules/invitation/database.ts` (un module, pas un service) doit appeler `createInvitationNotification(tx, …)` **dans sa transaction**. Or le skill interdit d'importer `database/` hors du service. L'IA interne doit définir le **point d'entrée exporté** adéquat (par exemple un export dédié aux appels transactionnels cross-module) **sans dupliquer** l'écriture `prisma.notification` dans le module invitation, et le documenter dans le `CLAUDE.md` du service notification.

---

## 3. `modules/invitation/database.ts` : `saveInvitationWithAudit`

Remplacer uniquement `saveInvitationWithAudit`. Ne pas toucher `saveInvitationToDatabase`, `logAuditAction`, `getOrganizationInvitations`, `getInvitationStats`, `updateInvitationToken`.

```ts
import { invalidateEvent } from '@/cache/server/graph'
// + import de createInvitationNotification depuis le point d'entrée défini (cf. §2)

export interface SaveInvitationParams {
  email: string
  token: string
  expiresAt: Date
  metadata: InvitationMetadata
  inviterUserId: string   // émetteur → AuditLog
  action: Action
  resourceId?: string
  resourceType?: Resource
  targetUserId?: string   // destinataire déjà inscrit → Invitation.userId + notification
}

export async function saveInvitationWithAudit(params: SaveInvitationParams) {
  const invitationDetails = createDatabaseDetails(params.metadata)
  const auditDetails = createAuditDetails(params.email, params.metadata)
  const orgId = params.metadata.organization.id
  if (!orgId) throw new Error("Organisation manquante dans les métadonnées d'invitation")

  const result = await prisma.$transaction(
    async (tx) => {
      const invitation = await tx.invitation.create({
        data: {
          email: params.email,
          token: params.token,
          expiresAt: params.expiresAt,
          orgId,
          invitationType: 'INVITE_ONLY',
          role: params.metadata.role,
          details: invitationDetails,
          ...(params.targetUserId ? { userId: params.targetUserId } : {}),
          ...(params.resourceId ? { resourceId: params.resourceId } : {}),
          ...(params.resourceType ? { resourceType: params.resourceType } : {}),
        },
      })

      const auditLog = await tx.auditLog.create({
        data: {
          userId: params.inviterUserId,
          action: params.action,
          resourceId: invitation.id || undefined,
          resource: 'USER',
          details: auditDetails,
        },
      })

      const notification = params.targetUserId
        ? await createInvitationNotification(tx, {
            userId: params.targetUserId,
            source: {
              invitationId: invitation.id,
              expiresAt: params.expiresAt,
              role: params.metadata.role,
              organization: { ...params.metadata.organization, id: orgId },
              senderName: params.metadata.invited_by?.name,
              resourceId: params.resourceId,
              resourceType: params.resourceType,
            },
          })
        : null

      return { invitation, auditLog, notification }
    },
    { maxWait: 10000, timeout: 20000 },
  )

  // Après commit uniquement : invalidé dans la tx, le cache pourrait se re-remplir avec l'ancien état.
  // Un échec d'invalidation ne doit pas faire échouer une invitation déjà persistée.
  if (result.notification && params.targetUserId) {
    try {
      await invalidateEvent('NOTIFICATION_CREATED', params.targetUserId)
    } catch (error) {
      console.error('[saveInvitationWithAudit] invalidation cache notification échouée', error)
    }
  }

  return result
}
```

**Obligatoire :** rechercher tous les appelants de `saveInvitationWithAudit` (`grep -rn saveInvitationWithAudit apps/web/src`) et les migrer vers la signature objet. `tsc` doit rester vert.

---

## 4. `modules/invitation/user.ts`

Ne modifier que les zones ci-dessous. Les étapes 1 à 3 et 5 (auth, RBAC, token, metadata) sont inchangées.

```ts
// Étape 4 : renommé, on ne charge que l'id
const existingUser = await prisma.user.findUnique({
  where: { email: params.email },
  select: { id: true },
});
const userStatus: UserStatus = existingUser ? "ACTIVE" : "NEW";

// Étape 5 (remise)
const deliveryMethod = params.deliveryMethod ?? "email";
let invitationLink: string | undefined;

if (deliveryMethod === "link") {
  const linkResult = existingUser
    ? await generateMagicLink(params.email, metadata)
    : await createInvitationLink(params.email, metadata);
  if (!linkResult.success) {
    return { error: linkResult.error || "Erreur Supabase" };
  }
  invitationLink = linkResult.link;
} else if (!existingUser) {
  const invitationResult = await sendSupabaseInvitation(params.email, metadata);
  if (!invitationResult.success) {
    return { error: invitationResult.error || "Erreur Supabase" };
  }
}
// existant + "email" : aucun appel Supabase, la remise = notification créée à l'étape suivante

// Étape 6 : persistance atomique (invitation + audit + notification si utilisateur existant)
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

// Retour
const inboxOnly = !!existingUser && deliveryMethod === "email";
return {
  data: {
    success: true,
    message:
      deliveryMethod === "link"
        ? `Lien d'invitation généré pour ${params.email}`
        : inboxOnly
          ? `Invitation déposée dans la boîte de réception de ${params.email}`
          : `Invitation envoyée à ${params.email}`,
    metadata,
    ...(invitationLink ? { link: invitationLink } : {}),
  },
};
```

> Corriger aussi la numérotation en double des commentaires (deux « 5. ») si le fichier est touché.

---

## 5. Critères de validation du Lot 1

- [ ] `tsc` vert, aucun `any` ni `Promise<>` explicite ajouté, aucun import inutilisé.
- [ ] Tous les appelants de `saveInvitationWithAudit` migrés.
- [ ] `prisma.notification` n'est écrit que dans le service `notification` ; le `CLAUDE.md` de ce service est mis à jour.
- [ ] Invitation d'un email **inconnu** (mode `email`) : flow Supabase inchangé, aucune notification créée, `Invitation.userId` reste `null`.
- [ ] Invitation d'un email **existant** (mode `email`) : aucun appel Supabase ; une ligne `Invitation` avec `userId = existingUser.id`, un `AuditLog`, une `Notification` (`type: INVITATION`, `read: false`).
- [ ] Invitation d'un email **existant** (mode `link`) : lien retourné + notification créée.
- [ ] Si l'écriture de la notification échoue, la transaction entière est annulée (aucune invitation orpheline).
- [ ] La `metadata` de la notification ne contient ni token, ni logo, ni nom de ressource.
- [ ] Le message affiche le libellé français du rôle, pas l'enum brut.

---

## 6. Hors périmètre du Lot 1 (décisions déjà prises, à implémenter au Lot 2)

- **Acceptation :** `Invitation.usedAt = now()` + rattachement à l'organisation + `notification.metadata.status = 'ACCEPTED'`.
- **Refus :** dans une tx, **lire d'abord** l'invitation (`select: { orgId, role, details }` avec `where: { id, userId, usedAt: null, expiresAt: { gt: now } }`), puis `expiresAt = now()` et `details: { ...details, status: 'DECLINED' }`. La lecture est obligatoire : Prisma **remplace** une colonne `Json` en entier, un `update({ details: { status } })` effacerait `role`, `organization` et `invited_by` (lus par `getOrganizationInvitations`). `usedAt` n'est pas touché au refus (sinon `getInvitationStats.accepted` compte les refus).
- Ajouter `'DECLINED'` au type `InvitationStatus` (aujourd'hui `'PENDING' | 'ACCEPTED' | 'REVOKED'`).
- `EXPIRED` n'est jamais stocké : calculé depuis `expiresAt`.
- Le refus doit **notifier l'émetteur** (`details.invited_by.id`).
- Autorisation des réponses : `invitation.userId === utilisateur connecté` (pas de token en paramètre).
- Actions inbox user-scoped : `authAccess` échoue sans `orgId`, composer `getUserInfo` à la main. Tags de cache indexés par `userId`.
- Web push après commit (`PushSubscription` existe) et email de prévenance (pas de provider) : plus tard.

## 7. Points encore ouverts (n'empêchent pas le Lot 1)

1. Type `NotificationType` de la notification de réponse à l'émetteur : `GENERAL` + `metadata.kind = 'INVITATION_RESPONSE'` (proposition, sans migration d'enum), ou nouvelle valeur d'enum.
2. Notifier l'émetteur aussi à l'**acceptation** (proposé : oui, par symétrie).
3. Le `console.log` existant côté `user.ts` affiche `result.invitation.token` : retrait suggéré (secret dans les logs), à confirmer.
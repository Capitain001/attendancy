##contexte : adapter le message d invitation au contexte 

## Code

### 1. Nouveau fichier `services/notification/invitation-action.ts`

J'y ai mis les gabarits à la place de `constants.ts` : ils ne dépendent que de cette union, ce qui évite un import circulaire. Dis-moi si tu préfères les déplacer à côté de `ROLE_LABELS`.

```ts
import { Resource } from '@/generated/prisma/client'
import type { Role } from '@/types/user'
import { ROLE_LABELS } from '@/modules/user/constants'

export const INVITATION_ACTIONS = ['JOIN_ORG', 'JOIN_CLASS', 'GRANT_ROLE'] as const
export type InvitationAction = (typeof INVITATION_ACTIONS)[number]

export function resolveInvitationAction(params: {
  resourceType?: Resource | null
  isExistingMember: boolean
}): InvitationAction {
  if (params.resourceType === Resource.CLASS) return 'JOIN_CLASS'
  return params.isExistingMember ? 'GRANT_ROLE' : 'JOIN_ORG'
}

type MessageInput = {
  orgName: string
  role: Role
  resourceName: string | null
  isExistingMember: boolean
}

const classLabel = (name: string | null) => (name ? `la classe ${name}` : 'une classe')

export const INVITATION_MESSAGES: Record<InvitationAction, (i: MessageInput) => string> = {
  JOIN_ORG: (i) =>
    `Vous avez été invité à rejoindre ${i.orgName} en tant que ${ROLE_LABELS[i.role]}.`,
  JOIN_CLASS: (i) =>
    i.isExistingMember
      ? `Vous avez été invité à rejoindre ${classLabel(i.resourceName)}.`
      : `Vous avez été invité à rejoindre ${classLabel(i.resourceName)} de ${i.orgName}.`,
  GRANT_ROLE: (i) => `${i.orgName} vous propose le rôle de ${ROLE_LABELS[i.role]}.`,
}

// Libellé du bouton d'acceptation, lu directement via metadata.action
export const INVITATION_ACCEPT_LABELS: Record<InvitationAction, string> = {
  JOIN_ORG: 'Accepter',
  JOIN_CLASS: 'Rejoindre la classe',
  GRANT_ROLE: 'Accepter le rôle',
}

export function buildInvitationResponseMessage(params: {
  kind: 'INVITATION_ACCEPTED' | 'INVITATION_DECLINED'
  actorName: string
  orgName: string
  action?: InvitationAction | null
  resourceName?: string | null
}) {
  const accepted = params.kind === 'INVITATION_ACCEPTED'
  const target =
    params.action === 'JOIN_CLASS'
      ? classLabel(params.resourceName ?? null)
      : params.orgName

  return accepted
    ? `${params.actorName} a accepté votre invitation à rejoindre ${target}.`
    : `${params.actorName} a décliné votre invitation à rejoindre ${target}.`
}

// Lecture typée de la metadata Json brute, sans mapping
export function readInvitationContext(metadata: unknown): {
  action: InvitationAction | null
  resourceName: string | null
} {
  const m = (metadata ?? {}) as { action?: InvitationAction; resourceName?: string | null }
  return { action: m.action ?? null, resourceName: m.resourceName ?? null }
}
```

### 2. `services/notification/server` : modifications

```ts
import {
  resolveInvitationAction,
  INVITATION_MESSAGES,
  buildInvitationResponseMessage,
  type InvitationAction,
} from './invitation-action'
```

**Source et builder**

```ts
export interface InvitationNotificationSource {
  invitationId: string
  expiresAt: Date
  role: Role
  organization: { id: string; name?: string; slug?: string }
  senderName?: string
  resourceId?: string | null
  resourceType?: Resource | null
  resourceName?: string | null
  isExistingMember?: boolean
}

export function buildInvitationNotification(source: InvitationNotificationSource) {
  const orgName = source.organization.name ?? 'une organisation'
  const isExistingMember = source.isExistingMember ?? false
  const resourceName = source.resourceName ?? null
  const action = resolveInvitationAction({
    resourceType: source.resourceType,
    isExistingMember,
  })

  return {
    type: 'INVITATION' as const,
    message: INVITATION_MESSAGES[action]({
      orgName,
      role: source.role,
      resourceName,
      isExistingMember,
    }),
    metadata: {
      kind: 'INVITATION_RECEIVED' as const,
      action,
      invitationId: source.invitationId,
      orgId: source.organization.id,
      orgName,
      orgSlug: source.organization.slug ?? null,
      role: source.role,
      resourceType: source.resourceType ?? null,
      resourceId: source.resourceId ?? null,
      resourceName,
      senderName: source.senderName ?? 'Un administrateur',
      expiresAt: source.expiresAt.toISOString(),
      status: 'PENDING',
    } satisfies Prisma.InputJsonObject,
  }
}
```

**`setInvitationNotificationStatus` renvoie la metadata** (nécessaire pour la notif à l'émetteur) :

```ts
  return tx.notification.update({
    where: { id: notif.id },
    data: {
      read: true,
      metadata: { ...(notif.metadata as object), status: params.status },
    },
    select: { id: true, metadata: true },
  })
```

**Notification de réponse**

```ts
export interface InvitationResponseSource {
  kind: 'INVITATION_ACCEPTED' | 'INVITATION_DECLINED'
  invitationId: string
  orgId: string
  orgName: string
  sender: { id: string; name?: string; email?: string }
  action?: InvitationAction | null
  resourceName?: string | null
}

// dans createInvitationResponseNotification :
const actorName =
  params.source.sender.name || params.source.sender.email || 'Un utilisateur'
const message = buildInvitationResponseMessage({
  kind: params.source.kind,
  actorName,
  orgName: params.source.orgName,
  action: params.source.action,
  resourceName: params.source.resourceName,
})
// supprimer `isAccepted` ; ajouter action et resourceName dans metadata :
//   action: params.source.action ?? null,
//   resourceName: params.source.resourceName ?? null,
```

### 3. `inbox-invitation.ts`

Dans `accept` (étape F/G) :

```ts
import { readInvitationContext } from '@/services/notification/invitation-action'

// F
const notif = await setInvitationNotificationStatus(tx, {
  userId,
  invitationId: invitation.id,
  status: 'ACCEPTED',
})
const { action, resourceName } = readInvitationContext(notif?.metadata)

// G
sender: { id: userId, name: user.name, email: user.email },
action,
resourceName,
```

Dans `decline`, même chose, à l'intérieur de la transaction :

```ts
const notif = await setInvitationNotificationStatus(tx, { ... status: 'DECLINED' })
const { action, resourceName } = readInvitationContext(notif?.metadata)
// puis action et resourceName dans `source` de createInvitationResponseNotification
```

### 4. `notifyInvitationStakeholders`

```ts
function buildMessage(
  event: InvitationNotifyEvent,
  invitedEmail: string,
  className?: string | null,
): string {
  const suffix = className ? ` (classe ${className})` : ''
  switch (event) {
    case 'CREATED':
      return `Invitation étudiant envoyée à ${invitedEmail}${suffix}`
    case 'RESENT':
      return `Invitation étudiant renvoyée pour ${invitedEmail}${suffix}`
    case 'LINK_GENERATED':
      return `Lien d'invitation généré pour ${invitedEmail}${suffix}`
    default:
      return `Mise à jour d'invitation pour ${invitedEmail}${suffix}`
  }
}

// dans la fonction, avant buildMessage :
const className = classId
  ? (await prisma.class.findFirst({ where: { id: classId, orgId }, select: { name: true } }))?.name
  : null
const message = buildMessage(event, invitedEmail, className)
```

Vérifie le nom du modèle Prisma (`class`) et le champ `orgId` sur `Class`.

### 5. Branchement à la création (`inviteUser` et `checkInvitationResources`)

Ces fichiers ne sont pas dans ce que tu m'as envoyé. Voici ce qu'il faut y ajouter :

```ts
// checkInvitationResources : ajouter au retour { valid: true, ... }
resourceName: cls.name   // la classe est déjà chargée pour la vérification

// inviteUser, là où buildInvitationNotification / upsertInvitationNotification est appelé
const isExistingMember = invitedUserId
  ? await checkOrgMembership(invitedUserId, orgId)
  : false

source: {
  ...,
  resourceName,       // remonté depuis checkInvitationResources
  isExistingMember,
}
```

Comme `inviteUser` ne reçoit que `resourceId` et `resourceType`, il faut lui passer `resourceName`. Dans `inviteStudent` et `inviteStudentsAction`, `check.resourceName` est déjà disponible après `checkInvitationResources`, il suffit de le transmettre dans l'appel.

### 6. UI (composant serveur)

```tsx
const { action } = readInvitationContext(notification.metadata)
<button>{INVITATION_ACCEPT_LABELS[action ?? 'JOIN_ORG']}</button>
```

Les anciennes notifications, sans `metadata.action`, retombent sur `JOIN_ORG`.
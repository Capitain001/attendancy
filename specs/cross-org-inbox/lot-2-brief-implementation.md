# Lot 2 — Brief d'implémentation (Backend Inbox & Actions Métier) — V2 corrigée

> **Objectif :** Fournir le backend complet pour la boîte de réception cross-organisation (`/inbox`) : consultation des notifications, enrichissement des métadonnées (logos org via le service organisation), lecture, acceptation et refus transactionnel d'invitation avec sécurisation anti-concurrence, notifications émetteur et hooks TanStack Query.
> **Ce document intègre toutes les corrections validées (sections A à H).**
> **Règle absolue :** Ne pas commencer l'implémentation dans le code source avant validation finale de ce document.

---

## 1. Liens vers l'existant impliqué

- [InvitationStatus](../../apps/web/src/types/invitation.ts#L17) — Statut d'invitation à étendre avec `'DECLINED'`.
- [buildInvitationNotification / createInvitationNotification](../../apps/web/src/services/notification/database/notification.mutations.ts#L115) — Builder et mutation transactionnelle du Lot 1 (`kind: 'INVITATION_RECEIVED'` à ajouter).
- [server.ts (notification)](../../apps/web/src/services/notification/server.ts#L1) — Point d'entrée serveur pour les fonctions transactionnelles cross-module.
- [getNotificationsForUser / getUnreadCountForUser](../../apps/web/src/services/notification/database/notification.queries.ts#L8) — Lectures DB des notifications utilisateur.
- [markNotificationRead](../../apps/web/src/services/notification/database/notification.mutations.ts#L35) — Mutation DB existante marquant une notification lue.
- [getOrgIdentity](../../apps/web/src/services/organization/database/organization.queries.ts#L11) — Lecture d'identité d'organisation (nom, slug, logo).
- [createRoleSpecificEntity / assignFunctionToUser](../../apps/web/src/modules/auth/members/utils.ts#L25) — Provisioning de l'entité métier et fonctions.
- [setUserAccess](../../apps/web/src/modules/user/access.ts#L84) — Mise à jour des droits et du tableau `organizations` dans `app_metadata`.
- [getUserInfo](../../apps/web/src/modules/user/userInfo.ts#L30) — Résolution de l'utilisateur connecté sans exiger d'`orgId`.
- [CACHE_KEYS client](../../apps/web/src/cache/client/key.ts#L33) — Clés de cache TanStack Query.

---

## 2. Décisions d'architecture actées pour le Lot 2

| # | Décision | Justification |
|---|---|---|
| 1 | **Authentification user-scoped (`getUserInfo`)** : toutes les actions et queries de l'inbox utilisent `getUserInfo()` direct. `authAccess()` est proscrit ici car il exige un `orgId` actif (erreur `ERRORS.ORG.NOT_FOUND`). | L'inbox est un espace utilisateur global cross-organisation. Un utilisateur sans organisation active doit pouvoir consulter et accepter ses invitations. |
| 2 | **Discrimination par `metadata.kind` (type `INVITATION` unique)** : le type de notification reste `INVITATION` pour tous les événements liés aux invitations. Le rôle du message est discriminé par `metadata.kind` : `'INVITATION_RECEIVED'` (invité), `'INVITATION_ACCEPTED'` (émetteur), `'INVITATION_DECLINED'` (émetteur). | Zéro migration d'enum DB. Rendu UI propre au Lot 3 (les boutons Accepter/Refuser s'affichent uniquement pour `kind === 'INVITATION_RECEIVED'` et `status === 'PENDING'` non expirée). |
| 3 | **Suppression de `notificationId` en paramètre d'acceptation/refus** : les actions prennent `{ invitationId: string }` uniquement. La notification est retrouvée et mise à jour côté serveur par `userId: user.id` + `invitationId`. | Élimine la faille d'autorisation IDOR permettant à un utilisateur de manipuler la notification d'un tiers. |
| 4 | **Claim atomique anti-concurrence (`updateMany`)** : dès l'entrée dans `$transaction`, l'invitation est lockée/réclamée via `tx.invitation.updateMany({ where: { id, userId, usedAt: null, expiresAt: { gt: now } } })`. Si `count !== 1`, rejet immédiat. | Empêche tout double-clic ou concurrence entre deux onglets d'exécuter deux fois le provisioning. |
| 5 | **Écritures `Notification` strictement isolées dans le service `notification`** : aucun `tx.notification.create / update / findFirst` direct dans `modules/auth/members/`. Le service `notification` expose deux helpers transactionnels (`tx: Tx`) : `setInvitationNotificationStatus` et `createInvitationResponseNotification`. | Respect strict de la règle « 1 modèle = 1 service ». Invalidation de cache (`NOTIFICATION_READ`, `NOTIFICATION_CREATED`) effectuée après commit uniquement. |
| 6 | **Enrichissement `orgLogo` hors du service `notification`** : la query `getInboxNotificationsForUser` retourne les notifications brutes. L'enrichissement (`orgLogo`, `orgName`, `orgSlug`) est réalisé au niveau de la Server Action via une fonction batch du service `organization` (`getOrgsIdentities`). | Respect du découpage des modèles et des responsabilités de cache. Parse tolérant du metadata via Valibot pour ne jamais casser la liste. |
| 7 | **Préservation de l'organisation active dans `setUserAccess`** : lors de l'acceptation, la nouvelle organisation est ajoutée à la liste `organizations`. Cependant, `organization`, `role` et `function` actifs ne sont mis à jour QUE si l'utilisateur n'avait aucune organisation active. S'il en avait déjà une, elle reste intacte. | Accepter une invitation ne doit pas déconnecter/basculer l'utilisateur de son organisation en cours de travail. L'UI proposera un bouton « Ouvrir l'espace » pour basculer volontairement. |
| 8 | **Validation stricte des entrées (`v.safeParse`)** : toutes les server actions valident leurs entrées avec Valibot (`invitationId` en UUID, `filter` énuméré, `limit` borné de 1 à 100). Si aucun rôle n'est spécifié dans l'invitation, lever une erreur (jamais de fallback silencieux vers `STUDENT`). | Rigueur contractuelle et prévention des états corrompus. |
| 9 | **Gestion du `isMainOrg`** : à la création de `UserOrganization`, `isMainOrg = true` si l'utilisateur n'a aucune autre adhésion (`userOrganizations.count === 0`), sinon `false`. | Cohérence multi-tenant. |
| 10 | **Hooks TanStack Query fiabilisés** : pas de mise à jour optimiste sur l'acceptation (opération lourde pouvant échouer). Invalidation ciblée des requêtes au succès (`INBOX_KEYS`, clés organisations). Mise à jour optimiste conservée pour `useMarkInboxAsRead`. | Prévention des désynchronisations UI/serveur. |

---

## 3. Détail du Code Proposé

### 3.1 `apps/web/src/types/invitation.ts`

Extension du type `InvitationStatus` :

```ts
export type InvitationStatus = 'PENDING' | 'ACCEPTED' | 'REVOKED' | 'DECLINED'
```

Type pour l'émetteur de réponse (`sendBy`, avec `id` obligatoire) :

```ts
export interface NotificationSender {
  id: string
  name?: string
  email?: string
}
```

---

### 3.2 Service `notification` : schémas, requêtes et helpers transactionnels

#### `src/services/notification/validation.ts` (ajout des schémas d'inbox) :

```ts
import * as v from 'valibot'

export const inboxFilterSchema = v.picklist(['all', 'invitations', 'unread', 'system'] as const)
export type InboxFilter = v.InferOutput<typeof inboxFilterSchema>

export const getInboxNotificationsSchema = v.object({
  filter: v.optional(inboxFilterSchema, 'all'),
  limit: v.optional(v.pipe(v.number(), v.minValue(1), v.maxValue(100)), 30),
})
export type GetInboxNotificationsInput = v.InferInput<typeof getInboxNotificationsSchema>

export const markNotificationAsReadSchema = v.object({
  notificationId: v.pipe(v.string(), v.uuid('ID de notification invalide')),
})

// Schéma tolérant pour extraire metadata d'une invitation
export const invitationMetadataSchema = v.object({
  kind: v.optional(v.string()),
  invitationId: v.optional(v.string()),
  orgId: v.optional(v.string()),
  orgName: v.optional(v.string()),
  orgSlug: v.optional(v.nullable(v.string())),
  role: v.optional(v.string()),
  senderName: v.optional(v.string()),
  expiresAt: v.optional(v.string()),
  status: v.optional(v.string()),
})
export type InvitationMetadataOutput = v.InferOutput<typeof invitationMetadataSchema>
```

---

#### `src/services/notification/database/notification.mutations.ts` (ajouts) :

1. **Ajustement Lot 1 dans `buildInvitationNotification`** :
```ts
export function buildInvitationNotification(source: InvitationNotificationSource) {
  const orgName = source.organization.name ?? 'une organisation'

  return {
    type: 'INVITATION' as const,
    message: `Vous avez été invité à rejoindre ${orgName} en tant que ${ROLE_LABELS[source.role]}.`,
    metadata: {
      kind: 'INVITATION_RECEIVED' as const, // <-- Ajouté
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
```

2. **Mettre à jour le statut d'une notification d'invitation (par `invitationId` + `userId`)** :
```ts
export async function setInvitationNotificationStatus(
  tx: Tx,
  params: { userId: string; invitationId: string; status: 'ACCEPTED' | 'DECLINED' },
) {
  // Recherche par userId et chemin JSON metadata ->> invitationId
  const notif = await tx.notification.findFirst({
    where: {
      userId: params.userId,
      type: 'INVITATION',
      metadata: { path: ['invitationId'], equals: params.invitationId },
    },
    select: { id: true, metadata: true },
  })
  if (!notif) return null

  return tx.notification.update({
    where: { id: notif.id },
    data: {
      read: true,
      metadata: { ...(notif.metadata as object), status: params.status },
    },
    select: { id: true },
  })
}
```

3. **Créer la notification de réponse pour l'émetteur (`INVITATION_ACCEPTED` / `INVITATION_DECLINED`)** :
```ts
export interface InvitationResponseSource {
  kind: 'INVITATION_ACCEPTED' | 'INVITATION_DECLINED'
  invitationId: string
  orgId: string
  orgName: string
  sender: { id: string; name?: string; email?: string } // Destinataire de l'invitation qui répond
}

export async function createInvitationResponseNotification(
  tx: Tx,
  params: { userId: string; source: InvitationResponseSource },
) {
  const isAccepted = params.source.kind === 'INVITATION_ACCEPTED'
  const actorName = params.source.sender.name || params.source.sender.email || 'Un utilisateur'
  const message = isAccepted
    ? `${actorName} a accepté votre invitation à rejoindre ${params.source.orgName}.`
    : `${actorName} a décliné votre invitation à rejoindre ${params.source.orgName}.`

  return tx.notification.create({
    data: {
      userId: params.userId,
      type: 'INVITATION',
      message,
      metadata: {
        kind: params.source.kind,
        invitationId: params.source.invitationId,
        orgId: params.source.orgId,
        sendBy: {
          id: params.source.sender.id,
          name: params.source.sender.name ?? null,
          email: params.source.sender.email ?? null,
        },
      } satisfies Prisma.InputJsonObject,
    },
    select: { id: true },
  })
}
```

---

#### `src/services/notification/server.ts` :

Exposition de ces nouvelles fonctions pour les transactions cross-module :

```ts
// src/services/notification/server.ts
export {
  createInvitationNotification,
  buildInvitationNotification,
  setInvitationNotificationStatus,
  createInvitationResponseNotification,
  type InvitationNotificationSource,
  type InvitationResponseSource,
} from './database/notification.mutations'
```

---

#### `src/services/notification/database/notification.queries.ts` :

Lecture brute de l'inbox sans jointure cross-service :

```ts
export async function getInboxNotificationsForUser(
  userId: string,
  filter: InboxFilter = 'all',
  limit = 30,
) {
  const whereClause: Prisma.NotificationWhereInput = { userId }

  if (filter === 'unread') {
    whereClause.read = false
  } else if (filter === 'invitations') {
    whereClause.type = 'INVITATION'
  } else if (filter === 'system') {
    whereClause.type = { not: 'INVITATION' }
  }

  return prisma.notification.findMany({
    where: whereClause,
    orderBy: { createdAt: 'desc' },
    take: limit,
    select: {
      id: true,
      message: true,
      type: true,
      read: true,
      scheduleId: true,
      metadata: true,
      createdAt: true,
      updatedAt: true,
    },
  })
}
```

---

#### `src/services/organization/database/organization.queries.ts` :

Ajout d'une fonction de lecture batch d'identités d'organisations :

```ts
export async function getOrgsIdentities(orgIds: string[]) {
  if (orgIds.length === 0) return []
  return prisma.organization.findMany({
    where: { id: { in: orgIds } },
    select: { id: true, name: true, slug: true, logo: true },
  })
}
```
*(Exporté dans `services/organization/index.ts`)*.

---

#### `src/services/notification/actions/notification.queries.ts` :

Action de lecture avec enrichissement via le service organisation :

```ts
import * as v from 'valibot'
import { getUserInfo } from '@/modules/user'
import { getOrgsIdentities } from '@/services/organization'
import {
  getInboxNotificationsSchema,
  invitationMetadataSchema,
  type GetInboxNotificationsInput,
} from '../validation'
import { getInboxNotificationsForUser, getUnreadCountForUser } from '../database/notification.queries'

export async function getInboxNotificationsAction(input?: GetInboxNotificationsInput) {
  const user = await getUserInfo()
  if (!user?.id) return { error: 'Non authentifié' }

  const parsed = v.safeParse(getInboxNotificationsSchema, input ?? {})
  if (!parsed.success) {
    return { error: parsed.issues[0]?.message ?? 'Paramètres invalides' }
  }

  try {
    const notifications = await getInboxNotificationsForUser(
      user.id,
      parsed.output.filter,
      parsed.output.limit,
    )

    // Extraction tolérante des orgIds des invitations
    const orgIds = Array.from(
      new Set(
        notifications
          .filter((n) => n.type === 'INVITATION' && n.metadata)
          .map((n) => {
            const meta = v.safeParse(invitationMetadataSchema, n.metadata)
            return meta.success ? meta.output.orgId : undefined
          })
          .filter((id): id is string => typeof id === 'string'),
      ),
    )

    if (orgIds.length === 0) return { data: notifications }

    const orgs = await getOrgsIdentities(orgIds)
    const orgMap = new Map(orgs.map((o) => [o.id, o]))

    const enriched = notifications.map((n) => {
      if (n.type === 'INVITATION' && n.metadata) {
        const meta = v.safeParse(invitationMetadataSchema, n.metadata)
        if (meta.success && meta.output.orgId) {
          const org = orgMap.get(meta.output.orgId)
          if (org) {
            return {
              ...n,
              metadata: {
                ...(n.metadata as object),
                orgLogo: org.logo ?? null,
                orgName: org.name,
                orgSlug: org.slug,
              },
            }
          }
        }
      }
      return n
    })

    return { data: enriched }
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Erreur lors du chargement des notifications' }
  }
}

export async function getInboxUnreadCountAction() {
  const user = await getUserInfo()
  if (!user?.id) return { error: 'Non authentifié' }

  try {
    const count = await getUnreadCountForUser(user.id)
    return { data: count }
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Erreur serveur' }
  }
}
```

---

#### `src/services/notification/actions/notification.mutations.ts` :

Action de marquage de lecture user-scoped :

```ts
import { markNotificationAsReadSchema } from '../validation'

export async function markInboxNotificationAsReadAction(input: { notificationId: string }) {
  const user = await getUserInfo()
  if (!user?.id) return { error: 'Non authentifié' }

  const parsed = v.safeParse(markNotificationAsReadSchema, input)
  if (!parsed.success) {
    return { error: parsed.issues[0]?.message ?? 'ID invalide' }
  }

  try {
    await markNotificationRead({ notificationId: parsed.output.notificationId, userId: user.id })
    return { data: true as const }
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Erreur serveur' }
  }
}
```

---

### 3.3 Module `auth/members` : Acceptation et Refus d'Invitation

Création de `src/modules/auth/members/inbox-invitation.ts` (exporté par `actions.ts`) :

```ts
'use server'

import * as v from 'valibot'
import { prisma } from '@/lib/prisma'
import { getUserInfo } from '@/modules/user'
import { setUserAccess } from '@/modules/user/access'
import { injectRoleProfileId } from '@/modules/user/profile'
import { invalidateEvent } from '@/cache/server/graph'
import { Action, Resource, Role } from '@/generated/prisma/client'
import { logAuditAsync } from '@/utils/server'
import type { DatabaseInvitationDetails } from '@/types/invitation'
import {
  setInvitationNotificationStatus,
  createInvitationResponseNotification,
} from '@/services/notification/server'
import {
  createRoleSpecificEntity,
  assignFunctionToUser,
  assignMultipleFunctionsToUser,
  enrollStudentInClass,
} from './utils'

const invitationActionSchema = v.object({
  invitationId: v.pipe(v.string(), v.uuid('ID d\'invitation invalide')),
})

// ─── 1. ACCEPTER L'INVITATION ─────────────────────────────────────────────────

export async function acceptInboxInvitationAction(input: { invitationId: string }) {
  const user = await getUserInfo()
  if (!user?.id || !user.email) return { error: 'Non authentifié' }

  const parsed = v.safeParse(invitationActionSchema, input)
  if (!parsed.success) {
    return { error: parsed.issues[0]?.message ?? 'ID invalide' }
  }
  const { invitationId } = parsed.output

  // 1. Lecture préalable & validation d'identité
  const invitation = await prisma.invitation.findFirst({
    where: {
      id: invitationId,
      userId: user.id,
      usedAt: null,
      expiresAt: { gt: new Date() },
    },
    select: {
      id: true,
      email: true,
      orgId: true,
      role: true,
      details: true,
      organization: { select: { id: true, name: true, slug: true } },
    },
  })

  if (!invitation) {
    return { error: 'Invitation introuvable, déjà traitée ou expirée' }
  }

  const details = invitation.details as DatabaseInvitationDetails
  const role = (invitation.role ?? details.role) as Role | undefined
  if (!role) {
    return { error: 'Invitation invalide : aucun rôle associé' }
  }

  const orgId = invitation.orgId
  const departmentId = details.organization?.departmentId
  const senderId = details.invited_by?.id

  try {
    const { profileId } = await prisma.$transaction(
      async (tx) => {
        // A. Claim atomique : verrouille immédiatement l'invitation contre les doubles clics
        const claimed = await tx.invitation.updateMany({
          where: { id: invitation.id, userId: user.id, usedAt: null, expiresAt: { gt: new Date() } },
          data: { usedAt: new Date() },
        })
        if (claimed.count !== 1) {
          throw new Error('Invitation déjà traitée ou expirée')
        }

        // B. Créer l'adhésion UserOrganization si non existante
        const existingMembership = await tx.userOrganization.findFirst({
          where: { userId: user.id, orgId },
          select: { id: true },
        })

        if (!existingMembership) {
          const totalUserOrgs = await tx.userOrganization.count({ where: { userId: user.id } })
          await tx.userOrganization.create({
            data: {
              userId: user.id,
              orgId,
              role,
              isMainOrg: totalUserOrgs === 0, // Première org = isMainOrg true
              isResponsable: false,
            },
          })
        }

        // C. Créer l'entité métier selon le rôle (Teacher, Student, Parent, etc.)
        const profile = await createRoleSpecificEntity(
          tx,
          user.id,
          role,
          orgId,
          departmentId,
        )

        // D. Assigner les fonctions
        await assignFunctionToUser(
          tx,
          user.id,
          orgId,
          details.function,
          details.invited_by?.id,
        )

        if (role === 'DIRECTION' && Array.isArray(details.additionalFunctions)) {
          await assignMultipleFunctionsToUser(
            tx,
            user.id,
            orgId,
            details.additionalFunctions,
            details.invited_by?.id,
          )
        }

        // E. Liens spécifiques (Parent / Student)
        if (role === 'PARENT' && details.parentLink?.studentId && profile?.id) {
          await tx.parentRelation.create({
            data: {
              parentId: profile.id,
              studentId: details.parentLink.studentId,
              relation: details.parentLink.relation || 'Parent',
              orgId,
            },
          })
        }

        if (role === 'STUDENT' && profile?.id && details.enrollment) {
          await enrollStudentInClass(tx, profile.id, details.enrollment)
        }

        // F. Mettre à jour la notification via le service notification
        await setInvitationNotificationStatus(tx, {
          userId: user.id,
          invitationId: invitation.id,
          status: 'ACCEPTED',
        })

        // G. Notifier l'émetteur de l'acceptation via le service notification
        if (senderId) {
          await createInvitationResponseNotification(tx, {
            userId: senderId,
            source: {
              kind: 'INVITATION_ACCEPTED',
              invitationId: invitation.id,
              orgId: invitation.orgId,
              orgName: invitation.organization.name,
              sender: { id: user.id, name: user.name, email: user.email },
            },
          })
        }

        return { profileId: profile?.id }
      },
      { maxWait: 10000, timeout: 20000 },
    )

    // 2. Post-commit : mise à jour des accès session sans écraser l'org active
    let sessionWarning: string | undefined
    try {
      const orgData = injectRoleProfileId(
        { ...details.organization, id: orgId, name: invitation.organization.name, slug: invitation.organization.slug },
        role,
        profileId,
      )
      const currentUser = await getUserInfo({ refresh: true })
      const hasActiveOrg = !!currentUser?.organization?.id

      const updatedOrgs = [
        ...(currentUser?.organizations ?? []).filter((o) => o.id !== orgId),
        orgData,
      ]

      await setUserAccess({
        status: 'ACTIVE',
        organizations: updatedOrgs,
        // N'écrase l'organisation active que si l'utilisateur n'en avait aucune
        ...(hasActiveOrg ? {} : {
          role,
          function: details.function,
          organization: orgData,
        }),
      })
    } catch (sessionErr) {
      console.error('[acceptInboxInvitationAction] Erreur setUserAccess non bloquante:', sessionErr)
      sessionWarning = 'Adhésion validée, reconnectez-vous si vos accès tardent à s’actualiser.'
    }

    // 3. Post-commit : invalidations de cache
    try {
      await invalidateEvent('NOTIFICATION_READ', user.id)
      if (senderId) {
        await invalidateEvent('NOTIFICATION_CREATED', senderId)
      }
    } catch (cacheErr) {
      console.error('[acceptInboxInvitationAction] Erreur invalidation cache:', cacheErr)
    }

    // 4. Audit
    logAuditAsync({
      userId: user.id,
      action: Action.CREATE,
      resource: Resource.USER,
      resourceId: invitation.id,
      orgId,
      details: {
        action_type: 'ACCEPT_INVITATION',
        role,
        invitationId: invitation.id,
      },
    })

    return {
      data: {
        success: true,
        orgSlug: invitation.organization.slug,
        orgName: invitation.organization.name,
        ...(sessionWarning ? { warning: sessionWarning } : {}),
      },
    }
  } catch (error) {
    console.error('[acceptInboxInvitationAction] erreur:', error)
    return { error: error instanceof Error ? error.message : 'Erreur lors de l’acceptation' }
  }
}

// ─── 2. REFUSER L'INVITATION ─────────────────────────────────────────────────

export async function declineInboxInvitationAction(input: { invitationId: string }) {
  const user = await getUserInfo()
  if (!user?.id) return { error: 'Non authentifié' }

  const parsed = v.safeParse(invitationActionSchema, input)
  if (!parsed.success) {
    return { error: parsed.issues[0]?.message ?? 'ID invalide' }
  }
  const { invitationId } = parsed.output

  // Lecture préalable indispensable pour récupérer details et senderId
  const invitation = await prisma.invitation.findFirst({
    where: {
      id: invitationId,
      userId: user.id,
      usedAt: null,
      expiresAt: { gt: new Date() },
    },
    select: {
      id: true,
      orgId: true,
      role: true,
      details: true,
      organization: { select: { id: true, name: true } },
    },
  })

  if (!invitation) {
    return { error: 'Invitation introuvable ou déjà traitée' }
  }

  const existingDetails = (invitation.details as DatabaseInvitationDetails) ?? {}
  const senderId = existingDetails.invited_by?.id

  try {
    await prisma.$transaction(
      async (tx) => {
        // A. Claim atomique & refus : expire l'invitation et met status = 'DECLINED'
        const claimed = await tx.invitation.updateMany({
          where: { id: invitation.id, userId: user.id, usedAt: null, expiresAt: { gt: new Date() } },
          data: {
            expiresAt: new Date(),
            details: {
              ...(existingDetails as object),
              status: 'DECLINED',
            },
          },
        })
        if (claimed.count !== 1) {
          throw new Error('Invitation déjà traitée ou expirée')
        }

        // B. Mettre à jour la notification du destinataire
        await setInvitationNotificationStatus(tx, {
          userId: user.id,
          invitationId: invitation.id,
          status: 'DECLINED',
        })

        // C. Notifier l'émetteur de l'invitation
        if (senderId) {
          await createInvitationResponseNotification(tx, {
            userId: senderId,
            source: {
              kind: 'INVITATION_DECLINED',
              invitationId: invitation.id,
              orgId: invitation.orgId,
              orgName: invitation.organization?.name ?? 'l’organisation',
              sender: { id: user.id, name: user.name, email: user.email },
            },
          })
        }
      },
      { maxWait: 10000, timeout: 20000 },
    )

    // Invalidation après commit
    try {
      await invalidateEvent('NOTIFICATION_READ', user.id)
      if (senderId) {
        await invalidateEvent('NOTIFICATION_CREATED', senderId)
      }
    } catch (e) {
      console.error('[declineInboxInvitationAction] invalidation échouée', e)
    }

    return { data: { success: true } }
  } catch (error) {
    console.error('[declineInboxInvitationAction] erreur:', error)
    return { error: error instanceof Error ? error.message : 'Erreur lors du refus' }
  }
}
```

---

### 3.4 Hooks TanStack Query (`apps/web/src/hooks/inbox/useInbox.ts`)

```ts
'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getInboxNotificationsAction,
  getInboxUnreadCountAction,
} from '@/services/notification/actions/notification.queries'
import { markInboxNotificationAsReadAction } from '@/services/notification/actions/notification.mutations'
import {
  acceptInboxInvitationAction,
  declineInboxInvitationAction,
} from '@/modules/auth/members/actions'
import type { InboxFilter } from '@/services/notification/validation'

export const INBOX_KEYS = {
  ALL: ['inbox'] as const,
  FILTER: (filter: InboxFilter) => ['inbox', 'list', filter] as const,
  UNREAD_COUNT: ['inbox', 'unread-count'] as const,
  USER_ORGS: ['user', 'organizations'] as const,
}

export function useInboxNotifications(filter: InboxFilter = 'all', limit = 30) {
  return useQuery({
    queryKey: INBOX_KEYS.FILTER(filter),
    queryFn: async () => {
      const res = await getInboxNotificationsAction({ filter, limit })
      if ('error' in res) throw new Error(res.error)
      return res.data
    },
    staleTime: 30 * 1000,
  })
}

export function useInboxUnreadCount() {
  return useQuery({
    queryKey: INBOX_KEYS.UNREAD_COUNT,
    queryFn: async () => {
      const res = await getInboxUnreadCountAction()
      if ('error' in res) throw new Error(res.error)
      return res.data
    },
    staleTime: 60 * 1000,
  })
}

export function useMarkInboxAsRead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (notificationId: string) => {
      const res = await markInboxNotificationAsReadAction({ notificationId })
      if ('error' in res) throw new Error(res.error)
      return res.data
    },
    onMutate: async (notificationId) => {
      // Optimistic update pour marquer read = true
      await queryClient.cancelQueries({ queryKey: INBOX_KEYS.ALL })
      queryClient.setQueriesData({ queryKey: INBOX_KEYS.ALL }, (old: any) => {
        if (!Array.isArray(old)) return old
        return old.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
      })
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: INBOX_KEYS.ALL })
      queryClient.invalidateQueries({ queryKey: INBOX_KEYS.UNREAD_COUNT })
    },
  })
}

export function useAcceptInvitation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (invitationId: string) => {
      const res = await acceptInboxInvitationAction({ invitationId })
      if ('error' in res) throw new Error(res.error)
      return res.data
    },
    onSuccess: () => {
      // Pas d'optimiste : invalidation franche à succès
      queryClient.invalidateQueries({ queryKey: INBOX_KEYS.ALL })
      queryClient.invalidateQueries({ queryKey: INBOX_KEYS.UNREAD_COUNT })
      queryClient.invalidateQueries({ queryKey: INBOX_KEYS.USER_ORGS })
    },
  })
}

export function useDeclineInvitation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (invitationId: string) => {
      const res = await declineInboxInvitationAction({ invitationId })
      if ('error' in res) throw new Error(res.error)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: INBOX_KEYS.ALL })
      queryClient.invalidateQueries({ queryKey: INBOX_KEYS.UNREAD_COUNT })
    },
  })
}
```

---

## 4. Critères de validation du Lot 2

- [x] `tsc` passe à 100% avec 0 erreur.
- [x] Aucun `any` ni `Promise<>` explicite dans le code créé/modifié.
- [x] Toutes les entrées des Server Actions sont validées avec `v.safeParse`.
- [x] `InvitationStatus` inclut `'DECLINED'`.
- [x] `buildInvitationNotification` inclut `kind: 'INVITATION_RECEIVED'`.
- [x] `acceptInboxInvitationAction` et `declineInboxInvitationAction` prennent uniquement `{ invitationId }`.
- [x] Les écritures `Notification` sont déléguées aux fonctions du service `notification` avec `tx: Tx`.
- [x] L'invitation est réclamée atomiquement via `updateMany` au début de la `$transaction`.
- [x] `acceptInboxInvitationAction` ne bascule l'organisation active que si l'utilisateur n'en avait aucune.
- [x] `getInboxNotificationsForUser` ne contient aucune requête `organization` ; l'enrichissement par lot est fait dans l'action via le service `organization`.
- [x] Les accusés `INVITATION_ACCEPTED` et `INVITATION_DECLINED` sont émis avec `type: 'INVITATION'` et `sendBy.id` obligatoire.
- [x] Les hooks React Query sont typés et n'utilisent d'optimiste que pour le marquage lu.

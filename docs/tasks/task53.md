# Plan final (v9)

Avec `kind` supprimé, la forme de `metadata` découle de la colonne `resourceType`. Je pars du principe que « on reste en surnombre » inclut aussi la paire `CONFIRMED` / `REJECTED` : c'est la seule hypothèse que j'ai prise, dis-moi si tu veux l'inverse. Je n'ai pas pu compiler ici.

## 1. Les règles

| Où | Rôle |
|---|---|
| `resourceType` + `resourceId` | sur quoi porte la notification |
| `event` | ce qui est arrivé à la ressource |
| `metadata` | ce qui sert au lien ou à l'affichage, sans refaire de requête |
| le texte du message | le détail (« renvoyée », « lien généré », « salle modifiée ») |

- **`metadata` n'a pas de `kind`** et ne répète jamais une colonne.
- **Une ressource secondaire s'écrit toujours `target: { type, id, name? }`**, pour ne plus avoir deux `resourceType` de sens différents.
- **Le bouton « Accepter » ne vient pas de `metadata`** : l'UI lit l'invitation via `resourceId` et n'affiche le bouton que si elle est `PENDING`.
- **`metadata` n'est jamais écrite par un client.** Seul le code serveur la construit, donc il n'y a pas de validation JSON à maintenir.

## 2. L'enum `event` : 7 valeurs

| Valeur | Sens | Exemples |
|---|---|---|
| `CREATED` | la ressource existe | absence marquée, invitation envoyée, message |
| `UPDATED` | modifiée | séance déplacée, note corrigée, invitation renvoyée |
| `CONFIRMED` | validée | invitation acceptée, justificatif accepté |
| `REJECTED` | refusée par celui qui reçoit ou décide | invitation déclinée, justificatif refusé |
| `CANCELED` | retirée par son auteur | séance annulée, invitation révoquée |
| `ASSIGNED` | lien ajouté | prof sur un cours, élève dans une classe |
| `UNASSIGNED` | lien retiré | idem |

## 3. Schéma et migration

Une seule modification : ajouter `REJECTED`.

```prisma
enum NotificationEvent {
  CREATED
  UPDATED
  CONFIRMED
  REJECTED
  CANCELED
  ASSIGNED
  UNASSIGNED

  @@schema("public")
}
```

Dans le fichier de migration, change la ligne `CREATE TYPE` si elle n'est pas encore appliquée :

```sql
CREATE TYPE "NotificationEvent" AS ENUM ('CREATED', 'UPDATED', 'CONFIRMED', 'REJECTED', 'CANCELED', 'ASSIGNED', 'UNASSIGNED');
```

Si elle est déjà appliquée, crée une migration à part : `ALTER TYPE "NotificationEvent" ADD VALUE 'REJECTED';`.

Le reste ne bouge pas : modèle `Notification`, trois index, FK `orgId`. Post-migrate : le `CHECK` `notification_resource_id_needs_type` et l'index partiel des non lues, dans `71_notification.sql`.

## 4. Types : `types.ts`

```typescript
// src/services/notification/types.ts
export * from './generated.types'

import type { Prisma } from '@/generated/prisma/client'
import type { Resource, NotificationEvent } from '@/generated/prisma/browser'
import type { InvitationAction } from '@/modules/invitation/constants'

/** Ressource secondaire d'une notification (classe, cours, séance...). */
export type NotificationTarget = { type: Resource; id: string; name?: string }

/** Forme de metadata selon la colonne resourceType. SCHEDULE et JUSTIFICATION n'en ont pas. */
export type NotificationMetadataByResource = {
  MESSAGE: { channelId: string }
  INVITATION: { action: InvitationAction; role?: string; target?: NotificationTarget }
  ATTENDANCE: { target?: NotificationTarget }
  GRADE: { target?: NotificationTarget }
}

export type NotificationMetadata =
  NotificationMetadataByResource[keyof NotificationMetadataByResource]

/** Payload accepté par l'envoi serveur (jamais construit par un client). */
export type NotificationPayload = {
  message: string
  orgId?: string
  resourceType?: Resource
  resourceId?: string
  event?: NotificationEvent
  metadata?: NotificationMetadata
}

/** Ce qu'un admin peut saisir depuis l'UI : pas de metadata, pas d'orgId. */
export type AdminNotificationData = Pick<
  Prisma.NotificationUncheckedCreateInput,
  'message' | 'resourceType' | 'resourceId' | 'event'
>
```

Un compromis à connaître : le compilateur ne vérifie pas que `metadata` correspond au `resourceType`. Cette règle repose sur les fonctions qui construisent la notification. Une version stricte (union discriminée sur `resourceType`) existe, mais elle complique l'appel depuis les actions admin, donc je ne l'ai pas prise.

## 5. Validation : `validation.ts`

Elle ne couvre plus que ce qu'un client peut envoyer.

```typescript
// src/services/notification/validation.ts
import * as v from 'valibot'
import { Resource, NotificationEvent } from '@/generated/prisma/browser'
import type { AdminNotificationData } from './types'

export const resourceTypeSchema = v.enum(Resource)
export const notificationEventSchema = v.enum(NotificationEvent)

// ─── Création par un admin ───────────────────────────────────────────────────

export const createAdminNotificationSchema = v.pipe(
  v.object({
    message: v.pipe(v.string(), v.trim(), v.minLength(1, 'Message requis'), v.maxLength(500)),
    resourceType: v.optional(resourceTypeSchema),
    resourceId: v.optional(v.pipe(v.string(), v.uuid('ID invalide'))),
    event: v.optional(notificationEventSchema),
  } satisfies Record<keyof AdminNotificationData, unknown>),
  v.check(
    (n) => n.resourceId === undefined || n.resourceType !== undefined,
    'resourceType requis quand resourceId est fourni',
  ),
)
export type CreateAdminNotificationInput = v.InferInput<typeof createAdminNotificationSchema>
export type CreateAdminNotificationOutput = v.InferOutput<typeof createAdminNotificationSchema>

// ─── Boîte de réception ──────────────────────────────────────────────────────

export const inboxFilterSchema = v.picklist(['all', 'invitations', 'unread', 'system'] as const)
export type InboxFilter = v.InferOutput<typeof inboxFilterSchema>

export const getInboxNotificationsSchema = v.object({
  filter: v.optional(inboxFilterSchema, 'all'),
  limit: v.optional(v.pipe(v.number(), v.minValue(1), v.maxValue(100)), 20),
  cursor: v.optional(v.string()),
})
export type GetInboxNotificationsInput = v.InferInput<typeof getInboxNotificationsSchema>

export const markNotificationAsReadSchema = v.object({
  notificationId: v.pipe(v.string(), v.uuid('ID de notification invalide')),
})
export type MarkNotificationAsReadInput = v.InferInput<typeof markNotificationAsReadSchema>
```

Disparus par rapport à avant : `notificationMetadataSchema`, `invitationMetadataSchema`, `parseNotificationMetadata`, `createNotificationSchema`, l'import de `INVITATION_ACTIONS` et celui de `ORGANIZATION_TYPES`. Fais une recherche globale de `InvitationMetadataOutput` et `invitationMetadataSchema` : si un composant d'invitation les utilise, dis-le-moi avant de les supprimer.

## 6. Constantes : `invitation/constants.ts`

`INVITATION_NOTIFY_EVENTS` n'a plus de raison d'être, parce que plus aucun schéma ne l'utilise.

```typescript
// src/modules/invitation/constants.ts

/**
 * Modes de remise d'une invitation :
 * - "email" : Supabase envoie lui-même l'email d'invitation (comportement par défaut)
 * - "link"  : on crée l'utilisateur et récupère le lien nous-mêmes, sans email Supabase
 */
export const DELIVERY_METHODS = ["email", "link"] as const;

export type DeliveryMethod = (typeof DELIVERY_METHODS)[number];

/** Actions déclenchées à l'acceptation d'une invitation. */
export const INVITATION_ACTIONS = ["JOIN_ORG", "JOIN_CLASS", "GRANT_ROLE"] as const;

export type InvitationAction = (typeof INVITATION_ACTIONS)[number];
```

## 7. Écriture : l'invitation étudiant

```typescript
// src/modules/invitation/notifications.ts
import { prisma } from "@/lib/prisma";
import { NotificationEvent, Resource, Role } from "@/generated/prisma/browser";
import { sendPushNotificationById } from "@/services/notification/server";
import type { NotificationMetadata } from "@/services/notification/types";

export type InvitationNotifyEvent = "CREATED" | "RESENT" | "LINK_GENERATED";

// Le détail (renvoyée / lien généré) reste dans le texte du message.
const EVENT_MAP: Record<InvitationNotifyEvent, NotificationEvent> = {
  CREATED: NotificationEvent.CREATED,
  RESENT: NotificationEvent.UPDATED,
  LINK_GENERATED: NotificationEvent.UPDATED,
};

const DIRECTION_FUNCTION_NAMES = ["PRINCIPAL", "SECRETARY"] as const;

function buildMessage(
  event: InvitationNotifyEvent,
  invitedEmail: string,
  className?: string | null,
): string {
  const suffix = className ? ` (classe ${className})` : "";
  switch (event) {
    case "CREATED":
      return `Invitation étudiant envoyée à ${invitedEmail}${suffix}`;
    case "RESENT":
      return `Invitation étudiant renvoyée pour ${invitedEmail}${suffix}`;
    case "LINK_GENERATED":
      return `Lien d'invitation généré pour ${invitedEmail}${suffix}`;
  }
}

/**
 * Notifie l'auteur de l'action et les membres DIRECTION ayant la fonction PRINCIPAL ou SECRETARY.
 * Ne bloque jamais le flux appelant (erreurs absorbées).
 */
export async function notifyInvitationStakeholders(params: {
  invitationId: string;
  orgId: string;
  actorId: string;
  event: InvitationNotifyEvent;
  invitedEmail: string;
  classId?: string;
  className?: string | null;
}): Promise<void> {
  try {
    const { invitationId, orgId, actorId, event, invitedEmail, classId, className } = params;

    const directionRows = await prisma.userOrganization.findMany({
      where: {
        orgId,
        role: Role.DIRECTION,
        user: {
          functions: {
            some: {
              function: {
                orgId,
                name: { in: [...DIRECTION_FUNCTION_NAMES] },
              },
            },
          },
        },
      },
      select: { userId: true },
      distinct: ["userId"],
    });

    const recipientIds = new Set<string>([actorId]);
    for (const row of directionRows) {
      recipientIds.add(row.userId);
    }

    const message = buildMessage(event, invitedEmail, className);
    const metadata: NotificationMetadata = {
      action: classId ? "JOIN_CLASS" : "JOIN_ORG",
      role: "STUDENT",
      ...(classId
        ? { target: { type: Resource.CLASS, id: classId, name: className ?? undefined } }
        : {}),
    };

    await Promise.allSettled(
      [...recipientIds].map((userId) =>
        sendPushNotificationById(userId, {
          orgId,
          message,
          resourceType: Resource.INVITATION,
          resourceId: invitationId,
          event: EVENT_MAP[event],
          metadata,
        }),
      ),
    );
  } catch (error) {
    console.error("[notifyInvitationStakeholders]", error);
  }
}
```

Une hypothèse de ma part : sans `classId`, j'écris `JOIN_ORG`. Corrige si ton invitation étudiant sans classe veut dire autre chose.

## 8. Lecture côté UI

```typescript
import type { Resource, NotificationEvent } from '@/generated/prisma/browser'
import type { NotificationMetadataByResource } from '@/services/notification/types'

// Un seul cast, localisé ici : le JSON de la base n'est pas typé.
export function getNotificationMetadata<R extends keyof NotificationMetadataByResource>(
  n: { resourceType: Resource | null; metadata: unknown },
  type: R,
): NotificationMetadataByResource[R] | null {
  if (n.resourceType !== type || !n.metadata || typeof n.metadata !== 'object') return null
  return n.metadata as NotificationMetadataByResource[R]
}

// Les routes sont des exemples, à adapter aux tiennes.
export function getNotificationHref(n: {
  resourceType: Resource | null
  resourceId: string | null
  metadata: unknown
}): string | null {
  if (!n.resourceType || !n.resourceId) return null
  switch (n.resourceType) {
    case 'SCHEDULE':   return `/planning/${n.resourceId}`
    case 'ATTENDANCE': return `/absences/${n.resourceId}`
    case 'INVITATION': return `/invitations/${n.resourceId}`
    case 'MESSAGE': {
      const meta = getNotificationMetadata(n, 'MESSAGE')
      return meta ? `/messages/${meta.channelId}#${n.resourceId}` : null
    }
    default: return null
  }
}

export const EVENT_STYLE: Record<NotificationEvent, 'success' | 'warning' | 'danger' | 'info'> = {
  CREATED: 'success',
  UPDATED: 'warning',
  CONFIRMED: 'success',
  REJECTED: 'danger',
  CANCELED: 'danger',
  ASSIGNED: 'info',
  UNASSIGNED: 'warning',
}
```

Les boutons « Accepter » / « Refuser » : charge l'invitation via `n.resourceId` et affiche-les seulement si son statut est `PENDING`. Ils ne dépendent donc d'aucun champ de `metadata`.

## 9. Fichiers à mettre à jour

| Fichier | Changement |
|---|---|
| `schema.prisma` + migration | `REJECTED` dans l'enum |
| `types.ts` | ajouts de la section 4 |
| `validation.ts` | version de la section 5 |
| `invitation/constants.ts` | version de la section 6 |
| `invitation/notifications.ts` | version de la section 7 |
| `user.ts` | `payload: NotificationPayload` à la place de `CreateNotificationOutput` |
| `actions/notification.mutations.ts` | `CreateAdminNotificationInput` et `createAdminNotificationSchema` à la place de `createNotificationSchema` |
| `database/notification.mutations.ts` | `data: NotificationPayload` pour `createUserNotification` ; `data: CreateAdminNotificationOutput` pour `createNotificationForOrgUser` |
| `schedule.events.ts` | supprimer `const metadata = {...}` et le `metadata,` de l'appel |
| `schedule.events.ts` | supprimer les deux `event as NotificationEvent` (voir ci-dessous) |

Pour les deux casts :

```typescript
type ScheduleEvent = Extract<NotificationEvent, "CREATED" | "CONFIRMED" | "UPDATED" | "CANCELED">

export type ScheduleNotifyParams =
  | { scheduleId: string; orgId: string; event: "CREATED"; audience?: "ALL" | "STUDENTS_AND_PARENTS" }
  | { scheduleId: string; orgId: string; event: Exclude<ScheduleEvent, "CREATED">; before: ScheduleNotifyBefore }
```

`audiences.ts` écrit déjà `ASSIGNED` et `UNASSIGNED` pour les réaffectations, donc il ne change pas.

## 10. Ordre et vérifications

1. Ajouter `REJECTED` au schéma et à la migration, puis l'appliquer et lancer `prisma generate`.
2. Mettre à jour les fichiers de la section 9.
3. `npx tsc --noEmit` : il te listera les `kind`, `CreateNotificationOutput` et `InvitationMetadataOutput` oubliés.
4. Appliquer `71_notification.sql`, puis `prisma migrate diff` pour vérifier que l'index partiel n'est pas proposé à la suppression.
5. `EXPLAIN ANALYZE` sur le badge et la liste des non lues.

## Points ouverts

- **Notification de l'invité** : je ne vois toujours pas le code qui crée celle que reçoit l'invité dans l'app (si elle existe). Elle utiliserait `metadata.action`, et son ancienne metadata (`orgName`, `senderName`...) serait à remplacer par une lecture de l'invitation via `resourceId`. Envoie-moi ce fichier avant de supprimer `invitationMetadataSchema`.
- **`sendPushNotificationToUserById`** est exportée d'un fichier `'use server'`, donc appelable depuis le navigateur avec n'importe quel `userId`. Déplace-la dans un fichier sans `'use server'`, et importe-la depuis là dans `schedule.events.ts` et `notifications.ts`.
- **Messages des autres scénarios** (absences, justificatifs, notes, chat) : ils suivent le modèle de `schedule.messages.ts`, un fichier `messages/<ressource>.messages.ts`, et je les écris quand tu décides de les implémenter.
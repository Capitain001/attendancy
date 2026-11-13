Dans `notification.mutations.ts`, **aucun changement n'est nécessaire** : le plan du cast `as Prisma.InputJsonObject` tombe. Les trois `JSON.parse(JSON.stringify(...))` renvoient `any`, donc Prisma accepte la valeur sans cast, et ce comportement reste identique. Il reste deux modifications : `types.ts` et `utils.ts`, plus une ligne dans `invitation/notifications.ts`.

## 1. `types.ts`

Remplace le bloc qui va de `NotificationTarget` jusqu'à `NotificationPayload` inclus. Le reste du fichier ne bouge pas.

```ts
/** Ressource secondaire d'une notification (classe, cours, séance...). */
export type NotificationTarget = { type: Resource; id: string; name?: string }

/** Forme de metadata selon la colonne resourceType. SCHEDULE et JUSTIFICATION n'en ont pas. */
export type NotificationMetadataByResource = {
  MESSAGE: { channelId: string }
  INVITATION: { action: InvitationAction; role?: string; target?: NotificationTarget }
  ATTENDANCE: { target?: NotificationTarget }
  GRADE: { target?: NotificationTarget }
}

export type OpenMetadata = Record<string, unknown>

/**
 * Metadata d'une ressource : champs connus typés + champs ajoutés tolérés.
 * Ressource sans schéma : objet ouvert (lecture uniquement, voir NotificationPayload).
 */
export type NotificationMetadataFor<R extends Resource> =
  R extends keyof NotificationMetadataByResource
    ? NotificationMetadataByResource[R] & OpenMetadata
    : OpenMetadata

export type NotificationMetadata = NotificationMetadataFor<keyof NotificationMetadataByResource>

/**
 * Payload accepté par l'envoi serveur (jamais construit par un client).
 * resourceType et metadata sont liés : une ressource avec schéma exige ses champs,
 * une ressource sans schéma n'accepte pas de metadata.
 */
export type NotificationPayload = {
  message: string
  orgId?: string
  event?: NotificationEvent
} & (
  | {
      [R in keyof NotificationMetadataByResource]: {
        resourceType: R
        resourceId?: string
        metadata?: NotificationMetadataFor<R>
      }
    }[keyof NotificationMetadataByResource]
  | { resourceType?: Resource; resourceId?: string; metadata?: undefined }
)
```

## 2. `utils.ts`

La fonction `getNotificationMetadata` change de signature, avec le même cast qu'avant. `getNotificationHref` et `EVENT_STYLE` restent inchangés.

```ts
import type { Resource, NotificationEvent } from '@/generated/prisma/browser'
import type { NotificationMetadataFor } from './types'

// Un seul cast, localisé ici : le JSON de la base n'est pas typé.
export function getNotificationMetadata<R extends Resource>(
  n: { resourceType: Resource | null; metadata?: unknown },
  type: R,
): NotificationMetadataFor<R> | null {
  if (n.resourceType !== type || !n.metadata || typeof n.metadata !== 'object') return null
  return n.metadata as NotificationMetadataFor<R>
}
```

Retire l'import de `NotificationMetadataByResource` si plus aucun autre usage dans le fichier.

## 3. `invitation/notifications.ts` : une ligne

Avec le payload lié, `NotificationMetadata` (l'union de toutes les ressources) n'est plus assignable à une notification `INVITATION`. Il faut typer la constante sur la ressource visée :

```ts
import type { NotificationMetadataFor } from "@/services/notification/types";

const metadata: NotificationMetadataFor<"INVITATION"> = {
  action: classId ? "JOIN_CLASS" : "JOIN_ORG",
  role: "STUDENT",
  ...(classId
    ? { target: { type: Resource.CLASS, id: classId, name: className ?? undefined } }
    : {}),
};
```

## 4. Garde-fou de typage (optionnel)

`services/notification/payload.types-check.ts` : `tsc` échoue si une règle du typage cesse d'être respectée.

```ts
import type { NotificationPayload } from './types'

export const ok: NotificationPayload = {
  message: 'm', resourceType: 'MESSAGE', metadata: { channelId: 'x', champAjoute: 1 }, // champ ajouté toléré
}
// @ts-expect-error channelId requis
export const bad1: NotificationPayload = { message: 'm', resourceType: 'MESSAGE', metadata: {} }
// @ts-expect-error action hors INVITATION_ACTIONS
export const bad2: NotificationPayload = { message: 'm', resourceType: 'INVITATION', metadata: { action: 'NOPE' } }
// @ts-expect-error SCHEDULE n'a pas de metadata
export const bad3: NotificationPayload = { message: 'm', resourceType: 'SCHEDULE', metadata: { a: 1 } }
```

## À lancer

Je n'ai pas pu compiler. Lance `npx tsc --noEmit` et colle-moi les erreurs :
- Une erreur sur `action` signifie qu'un écrivain d'invitation ne l'envoie pas. Dis-moi lequel, je rendrai `action` optionnel ou on corrigera l'écrivain.
- Une erreur sur `bad1` à `bad3` (« unused @ts-expect-error ») signifie que le typage est trop permissif. C'est le signal que je veux voir.

Une remarque : `setInvitationNotificationStatus` écrit toujours `status` dans `metadata`, hors typage. Cette fonction n'est pas cassée par ce changement. D'après la règle v9, l'UI lit le statut sur l'invitation via `resourceId`, donc cette écriture devient inutile le jour où ses lecteurs sont migrés. Je la laisse de côté pour l'instant.
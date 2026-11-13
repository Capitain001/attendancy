import type { NotificationPayload } from './types'

export const ok: NotificationPayload = {
  message: 'm',
  resourceType: 'MESSAGE',
  metadata: { channelId: 'x', champAjoute: 1 }, // champ ajouté toléré
}

// @ts-expect-error channelId requis
export const bad1: NotificationPayload = { message: 'm', resourceType: 'MESSAGE', metadata: {} }

// @ts-expect-error action hors INVITATION_ACTIONS
export const bad2: NotificationPayload = { message: 'm', resourceType: 'INVITATION', metadata: { action: 'NOPE' } }

// @ts-expect-error SCHEDULE n'a pas de metadata
export const bad3: NotificationPayload = { message: 'm', resourceType: 'SCHEDULE', metadata: { a: 1 } }


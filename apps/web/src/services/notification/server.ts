// src/services/notification/server.ts
// Point d'entrée serveur pour les mutations participant à une transaction externe.
// Note : les mutations avec tx n'invalident pas le cache — l'appelant appelle invalidateEvent après commit.

export {
  createInvitationNotification,
  buildInvitationNotification,
  setInvitationNotificationStatus,
  createInvitationResponseNotification,
  type InvitationNotificationSource,
  type InvitationResponseSource,
} from './database/notification.mutations'

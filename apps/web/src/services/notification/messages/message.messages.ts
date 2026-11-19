// services/notification/messages/message.messages.ts

/** Textes des notifications de chat. Les builders s'y réfèrent, ils n'écrivent aucun texte. */
export const chatNotificationMessages = {
  reply: (senderName: string, preview: string) =>`${senderName} a répondu à votre message : ${preview}`,
} as const

type BuildMessageParams = {
  recipientId: string
  // Auteur du message cité, null si ce n'est pas une réponse
  parentUserId: string | null
  senderName: string
  preview: string
}

/**
 * Texte de la notification d'un message de chat, selon son destinataire :
 * l'auteur du message cité reçoit la réponse dédiée, les autres l'aperçu seul.
 */
export function buildMessage({ recipientId, parentUserId, senderName, preview }: BuildMessageParams) {
  return recipientId === parentUserId
    ? chatNotificationMessages.reply(senderName, preview)
    : preview
}
// ⚠ Fichier généré automatiquement — NE PAS ÉDITER À LA MAIN
// Régénérer : npx tsx scripts/generate/types/types.ts chat
// Pour surcharger un type, définissez-le dans ./types.ts (jamais écrasé).

import { createMessage, updateMessage, removeMessage, getMessages, getRoomParticipants } from './database'

export type CreateMessageDto = Awaited<ReturnType<typeof createMessage>>
export type UpdateMessageDto = Awaited<ReturnType<typeof updateMessage>>
export type RemoveMessageDto = Awaited<ReturnType<typeof removeMessage>>
export type GetMessagesDto = Awaited<ReturnType<typeof getMessages>>
export type GetRoomParticipantsDto = Awaited<ReturnType<typeof getRoomParticipants>>

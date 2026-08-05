// ⚠ Fichier généré automatiquement — NE PAS ÉDITER À LA MAIN
// Régénérer : npx tsx scripts/generate/types/types.ts chat
// Pour surcharger un type, définissez-le dans ./types.ts (jamais écrasé).

import { getMessages, getRoomParticipants } from './database'

export type GetMessagesDto = Awaited<ReturnType<typeof getMessages>>
export type GetRoomParticipantsDto = Awaited<ReturnType<typeof getRoomParticipants>>

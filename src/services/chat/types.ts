import type { getMessages, getRoomParticipants, AddMessageData, UpdateMessageData } from './database'

export type { AddMessageData, UpdateMessageData }

export type ChatMessage = Awaited<ReturnType<typeof getMessages>>[number]
export type ChatRoomParticipant = Awaited<ReturnType<typeof getRoomParticipants>>[number]

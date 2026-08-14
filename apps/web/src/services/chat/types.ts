// src/services/chat/types.ts
import type { Prisma } from '@/generated/prisma/client'
import { getMessages, getRoomParticipants } from './database'

export * from './generated.types'

export type ChatMessage = Awaited<ReturnType<typeof getMessages>>[number]
export type ChatRoomParticipant = Awaited<ReturnType<typeof getRoomParticipants>>[number]

export type CreateMessageData = Pick<Prisma.MessageUncheckedCreateInput, 'content' | 'channelId' | 'parentId'>
export type UpdateMessageData = Pick<Prisma.MessageUncheckedUpdateInput, 'content'>

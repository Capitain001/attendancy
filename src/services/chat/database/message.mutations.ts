import { prisma } from '@/lib/prisma'

export interface AddMessageData {
  content: string
  channelId: string
  userId: string
  parentId?: string
}

export type UpdateMessageData = { content: string }

export async function createMessage(data: AddMessageData) {
  return prisma.message.create({
    data,
    select: {
      id: true, content: true, createdAt: true, updatedAt: true, channelId: true, parentId: true,
      user: { select: { id: true, firstName: true, lastName: true, avatar_url: true } },
    },
  })
}

export async function updateMessage(messageId: string, userId: string, data: UpdateMessageData) {
  return prisma.message.update({
    where: { id: messageId, userId },
    data: { content: data.content },
    select: {
      id: true, content: true, createdAt: true, updatedAt: true, channelId: true, parentId: true,
      user: { select: { id: true, firstName: true, lastName: true, avatar_url: true } },
    },
  })
}

export async function removeMessage(messageId: string, userId: string) {
  return prisma.message.update({
    where: { id: messageId, userId },
    data: { deletedAt: new Date() },
    select: { id: true },
  })
}

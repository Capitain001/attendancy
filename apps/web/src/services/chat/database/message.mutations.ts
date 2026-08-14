//src/services/chat/database/message.mutations.ts
import { prisma } from '@/lib/prisma'
import { tryConstraint } from '@/utils/server/prisma'
import type { CreateMessageOutput, UpdateMessageDataOutput } from '../validation'

export async function createMessage(data: CreateMessageOutput & { userId: string }) {
  return tryConstraint(prisma.message.create({
    data,
    select: {
      id: true, content: true, createdAt: true, updatedAt: true, channelId: true, parentId: true,
      user: { select: { id: true, firstName: true, lastName: true, avatar_url: true } },
    },
  }))
}

export async function updateMessage(messageId: string, userId: string, data: UpdateMessageDataOutput) {
  return tryConstraint(prisma.message.update({
    where: { id: messageId, userId },
    data: { content: data.content },
    select: {
      id: true, content: true, createdAt: true, updatedAt: true, channelId: true, parentId: true,
      user: { select: { id: true, firstName: true, lastName: true, avatar_url: true } },
    },
  }))
}

export async function removeMessage(messageId: string, userId: string) {
  return prisma.message.update({
    where: { id: messageId, userId },
    data: { deletedAt: new Date() },
    select: { id: true },
  })
}

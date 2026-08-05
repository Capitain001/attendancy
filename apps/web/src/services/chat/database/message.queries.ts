import { prisma } from '@/lib/prisma'

export async function getMessages(channelId: string, limit = 50) {
  return prisma.message.findMany({
    where: { channelId, deletedAt: null },
    select: {
      id: true, content: true, createdAt: true, updatedAt: true, channelId: true, parentId: true,
      user: { select: { id: true, firstName: true, lastName: true, avatar_url: true } },
    },
    orderBy: { createdAt: 'asc' },
    take: limit,
  })
}

export async function getRoomParticipants(channelId: string) {
  return prisma.channelMember.findMany({
    where: { channelId },
    select: {
      userId: true, role: true, joinedAt: true,
      user: { select: { id: true, firstName: true, lastName: true, avatar_url: true } },
    },
  })
}

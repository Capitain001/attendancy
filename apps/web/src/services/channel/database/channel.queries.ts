import { prisma } from '@/lib/prisma'
import { CACHE } from '@/cache/server/key'
import { cacheTag , cacheLife} from 'next/cache'

export const CHANNEL_SELECT = {
  id: true,
  type: true,
  name: true,
  isPrivate: true,
  classId: true,
  groupId: true,
  createdAt: true,
} as const

export async function getChannels(orgId: string) {
  'use cache'
  cacheTag(CACHE.CHANNEL(orgId))
  cacheLife('minutes')

  return prisma.channel.findMany({
    where: { orgId, deletedAt: null },
    select: CHANNEL_SELECT,
    orderBy: { createdAt: 'asc' },
  })
}

export async function getChannel(channelId: string, orgId: string) {
  'use cache'
  cacheTag(CACHE.CHANNEL(orgId, channelId))
  cacheLife('minutes')

  return prisma.channel.findFirst({
    where: { id: channelId, orgId, deletedAt: null },
    select: CHANNEL_SELECT,
  })
}
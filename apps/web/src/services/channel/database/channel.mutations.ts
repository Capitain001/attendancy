import { prisma } from '@/lib/prisma'
import { tryConstraint } from '@/utils/server/prisma'
import type { CreateChannelOutput, UpdateChannelDataOutput } from '../validation'
import { CHANNEL_SELECT } from './channel.queries'
import { invalidateEvent } from '@/cache/server/graph'

export async function createChannel(data: CreateChannelOutput & { orgId: string }) {
  const channel = await tryConstraint(
    prisma.channel.create({
      data,
      select: CHANNEL_SELECT,
    }),
  )

  await invalidateEvent('CHANNEL_CREATED', data.orgId)
  return channel
}

export async function updateChannel(channelId: string, orgId: string, data: UpdateChannelDataOutput) {
  const channel = await tryConstraint(
    prisma.channel.update({
      where: { id: channelId, orgId, deletedAt: null },
      data,
      select: CHANNEL_SELECT,
    }),
  )

  await invalidateEvent('CHANNEL_UPDATED', orgId, channelId)
  return channel
}

export async function removeChannel(channelId: string, orgId: string) {
  const channel = await tryConstraint(
    prisma.channel.update({
      where: { id: channelId, orgId, deletedAt: null },
      data: { deletedAt: new Date() },
      select: { id: true },
    }),
  )

  await invalidateEvent('CHANNEL_REMOVED', orgId, channelId)
  return channel
}
// apps/web/src/services/channel-member/database/channel-member.mutations.ts
import { prisma } from '@/lib/prisma'
import { tryConstraint } from '@/utils/server/prisma'
import { invalidateEvent } from '@/cache/server/graph'
import type { UpdateChannelMuteDataOutput } from '../validation'

// updateMany : permet le filtre sur le canal (orgId, non supprimé) et rend count sans lecture
// préalable. count = 0 : l'utilisateur n'est pas membre de ce canal.
export async function updateChannelMuteByUser(
  { channelId, userId, orgId }: { channelId: string; userId: string; orgId: string },
  data: UpdateChannelMuteDataOutput,
) {
  const result = await tryConstraint(
    prisma.channelMember.updateMany({
      where: { channelId, userId, channel: { orgId, deletedAt: null } },
      data: { mutedAt: data.muted ? new Date() : null },
    }),
  )

  await invalidateEvent('CHANNEL_MEMBER_MUTE_UPDATED', orgId, channelId)
  return result
}

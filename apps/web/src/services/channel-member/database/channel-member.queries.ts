//apps\web\src\services\channel-member\database\channel-member.queries.ts
import { prisma } from '@/lib/prisma'

// Sans "use cache" : un ex-membre ne doit pas pouvoir écrire pendant la durée d'un cache.
export async function isChannelMember({
  channelId,
  userId,
  orgId,
}: {
  channelId: string
  userId: string
  orgId: string
}) {
  const member = await prisma.channelMember.findFirst({
    where: { channelId, userId, channel: { orgId, deletedAt: null } },
    select: { id: true },
  })
  return !!member
}

export async function getChannelMember(channelId: string) {
  return prisma.channelMember.findMany({
    where: { channelId },
    select: {
      role: true, joinedAt: true,
      user: { select: { id: true, firstName: true, lastName: true, avatar_url: true } },
    },
  })
}

/**
 * Ids des membres d'un canal, hors ids exclus.
 * Le filtre est appliqué par la base et seul `userId` est lu (pas de jointure User).
 * Un id exclu étranger au canal est sans effet.
 * Ne vérifie pas l'appartenance de l'appelant : à utiliser après isChannelMember.
 */
export async function getChannelMemberIds({
  channelId,
  excludedIds,
}: {
  channelId: string
  excludedIds: string[]
}) {
  const rows = await prisma.channelMember.findMany({
    where: { channelId, userId: { notIn: excludedIds } },
    select: { userId: true },
  })
  return rows.map((row) => row.userId)
}
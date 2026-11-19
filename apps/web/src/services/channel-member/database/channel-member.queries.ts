// apps/web/src/services/channel-member/database/channel-member.queries.ts
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
      role: true,
      joinedAt: true,
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

// Tous les destinataires potentiels, avec leur sourdine : le filtrage se fait dans l'opération
// de notification, parce qu'une réponse directe traverse la sourdine.
// Pas de "use cache" : lecture faite à l'instant de l'envoi, une sourdine doit agir tout de suite.
export async function getChannelRecipients({
  channelId,
  excludedIds,
}: {
  channelId: string
  excludedIds: string[]
}) {
  return prisma.channelMember.findMany({
    where: { channelId, userId: { notIn: excludedIds } },
    select: { userId: true, mutedAt: true },
  })
}

// Sourdine de l'utilisateur sur un canal de son organisation.
// null = pas membre (ou canal supprimé). Sans "use cache" : l'UI relit l'état après chaque bascule.
export async function getChannelMuteByUser({
  channelId,
  userId,
  orgId,
}: {
  channelId: string
  userId: string
  orgId: string
}) {
  return prisma.channelMember.findFirst({
    where: { channelId, userId, channel: { orgId, deletedAt: null } },
    select: { mutedAt: true },
  })
}

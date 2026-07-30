// src/services/invite/database/invite.queries.ts
import { prisma } from '@/lib/prisma'

export async function getInviteByToken(token: string) {
  return prisma.invitation.findUnique({
    where: { token },
    select: {
      id: true,
      token: true,
      email: true,
      orgId: true,
      details: true,
      expiresAt: true,
      usedAt: true,
      invitationType: true,
      organization: { select: { id: true, name: true, slug: true } },
    },
  })
}

export async function getOrgInvites(orgId: string) {
  return prisma.invitation.findMany({
    where: { orgId },
    select: {
      id: true,
      email: true,
      details: true,
      createdAt: true,
      expiresAt: true,
      usedAt: true,
    },
    orderBy: { createdAt: 'desc' },
  })
}

// src/services/invite/database/invite.mutations.ts
// Prisma pur — AUCUNE auth ici.
import { Role } from '@/generated/prisma/enums'
import { prisma } from '@/lib/db'


export type CreateInvitationParams = {
  email: string
  orgId: string
  role: Role
  expiresAt: Date
}

export async function createInvitation(token: string, params: CreateInvitationParams) {
  return prisma.invitation.create({
    data: {
      token,
      email: params.email,
      orgId: params.orgId,
      details: { role: params.role },
      expiresAt: params.expiresAt,
      invitationType: 'INVITE_ONLY',
    },
    select: { id: true, token: true },
  })
}

export type CompleteInviteParams = {
  userId: string
  email: string
  firstName?: string
  lastName?: string
  invitationId: string
  orgId: string
  role: Role
}

export async function completeInvite(params: CompleteInviteParams) {
  return prisma.$transaction(async (tx) => {
    await tx.user.upsert({
      where: { id: params.userId },
      create: {
        id: params.userId,
        email: params.email,
        firstName: params.firstName ?? null,
        lastName: params.lastName ?? null,
        status: 'ACTIVE',
      },
      update: {
        ...(params.firstName ? { firstName: params.firstName } : {}),
        ...(params.lastName ? { lastName: params.lastName } : {}),
        status: 'ACTIVE',
      },
    })

    await tx.userOrganization.upsert({
      where: { userId_orgId: { userId: params.userId, orgId: params.orgId } },
      create: {
        userId: params.userId,
        orgId: params.orgId,
        role: params.role,
        isMainOrg: true,
        status: 'ACTIVE',
      },
      update: { status: 'ACTIVE' },
    })

    const profile = await createRoleProfile(tx, params.userId, params.orgId, params.role)

    await tx.invitation.update({
      where: { id: params.invitationId },
      data: { usedAt: new Date(), userId: params.userId },
    })

    await tx.auditLog.create({
      data: {
        userId: params.userId,
        action: 'CREATE',
        resource: 'USER',
        resourceId: params.userId,
        orgId: params.orgId,
        details: { event: 'invite_accepted', role: params.role },
      },
    })

    return { profileId: profile.id }
  })
}

export async function resendInvite(invitationId: string, newExpiry: Date) {
  return prisma.invitation.update({
    where: { id: invitationId },
    data: { expiresAt: newExpiry },
    select: { id: true, email: true },
  })
}

export async function deleteInvitation(invitationId: string) {
  return prisma.invitation.delete({ where: { id: invitationId }, select: { id: true } })
}

type TxClient = Parameters<Parameters<typeof prisma.$transaction>[0]>[0]

async function createRoleProfile(
  tx: TxClient,
  userId: string,
  orgId: string,
  role: Role
): Promise<{ id: string }> {
  switch (role) {
    case 'TEACHER':
      return tx.teacher.upsert({
        where: { userId_orgId: { userId, orgId } },
        create: { userId, orgId },
        update: { deletedAt: null },
        select: { id: true },
      })
    case 'STUDENT':
      return tx.student.upsert({
        where: { userId_orgId: { userId, orgId } },
        create: { userId, orgId },
        update: { deletedAt: null },
        select: { id: true },
      })
    case 'PARENT':
      return tx.parent.upsert({
        where: { userId_orgId: { userId, orgId } },
        create: { userId, orgId },
        update: { deletedAt: null },
        select: { id: true },
      })
    default:
      throw new Error(`Rôle non invitable : ${role}`)
  }
}

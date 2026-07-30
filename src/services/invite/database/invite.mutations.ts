// src/services/invite/database/invite.mutations.ts
// Prisma pur — AUCUNE auth ici.
import { Role, Resource } from '@/generated/prisma/enums'
import { prisma } from '@/lib/prisma'


export type CreateInvitationParams = {
  email: string
  orgId: string
  role: Role
  expiresAt: Date
  details?: Record<string, unknown>
  resourceId?: string
  resourceType?: Resource
}

export async function createInvitation(token: string, params: CreateInvitationParams) {
  return prisma.invitation.create({
    data: {
      token,
      email: params.email,
      orgId: params.orgId,
      details: { role: params.role, ...params.details },
      expiresAt: params.expiresAt,
      invitationType: 'INVITE_ONLY',
      ...(params.resourceId ? { resourceId: params.resourceId } : {}),
      ...(params.resourceType ? { resourceType: params.resourceType } : {}),
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
  // Champs optionnels lus depuis invitation.details pour le rôle DIRECTION
  functionDetails?: { function?: string; additionalFunctions?: string[] }
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

    // Assign functions for DIRECTION — ownership futur : services/function/database/
    if (params.role === 'DIRECTION' && params.functionDetails) {
      const fnsToAssign = [
        ...(params.functionDetails.function ? [params.functionDetails.function] : []),
        ...(params.functionDetails.additionalFunctions ?? []),
      ]
      for (const fnName of fnsToAssign) {
        const fn = await tx.function.findUnique({
          where: { name_orgId: { name: fnName, orgId: params.orgId } },
          select: { id: true },
        })
        if (!fn) continue
        await tx.userFunction.upsert({
          where: { userId_functionId: { userId: params.userId, functionId: fn.id } },
          create: { userId: params.userId, functionId: fn.id },
          update: {},
        })
      }
    }

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
    case 'DIRECTION':
      return tx.direction.upsert({
        where: { userId_orgId: { userId, orgId } },
        create: { userId, orgId },
        update: { deletedAt: null },
        select: { id: true },
      })
    default:
      throw new Error(`Rôle non géré dans createRoleProfile : ${role}`)
  }
}

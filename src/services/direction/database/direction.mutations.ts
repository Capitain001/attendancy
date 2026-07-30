import { prisma } from '@/lib/prisma'
import { invalidateEvent } from '@/cache/server/key'
import { assignMultipleFunctionsToUser } from '@/services/auth/members/utils'

export async function assignFunctionsToMember(params: {
  userId: string
  orgId: string
  functionNames: string[]
  assignedBy?: string
}) {
  const direction = await prisma.direction.findFirst({
    where: { userId: params.userId, orgId: params.orgId, deletedAt: null },
  })
  if (!direction) throw new Error('Membre de la direction introuvable')

  await prisma.$transaction(async (tx) => {
    await assignMultipleFunctionsToUser(tx, params.userId, params.orgId, params.functionNames, params.assignedBy ?? null)
  })
  await invalidateEvent('DIRECTION_UPDATED', params.orgId)
}

export async function revokeFunctionsFromMember(params: {
  userId: string
  orgId: string
  functionIds: string[]
}) {
  const direction = await prisma.direction.findFirst({
    where: { userId: params.userId, orgId: params.orgId, deletedAt: null },
  })
  if (!direction) throw new Error('Membre de la direction introuvable')

  await prisma.userFunction.deleteMany({
    where: {
      userId: params.userId,
      functionId: { in: params.functionIds },
      function: { orgId: params.orgId },
    },
  })
  await invalidateEvent('DIRECTION_UPDATED', params.orgId)
}

export async function updateMemberFunctions(params: {
  userId: string
  orgId: string
  functionNames: string[]
  assignedBy?: string
}) {
  const direction = await prisma.direction.findFirst({
    where: { userId: params.userId, orgId: params.orgId, deletedAt: null },
  })
  if (!direction) throw new Error('Membre de la direction introuvable')

  await prisma.$transaction(async (tx) => {
    await tx.userFunction.deleteMany({
      where: { userId: params.userId, function: { orgId: params.orgId } },
    })
    if (params.functionNames.length > 0) {
      await assignMultipleFunctionsToUser(tx, params.userId, params.orgId, params.functionNames, params.assignedBy ?? null)
    }
  })
  await invalidateEvent('DIRECTION_UPDATED', params.orgId)
}

export async function removeDirectionMember(directionId: string, orgId: string) {
  const existing = await prisma.direction.findFirst({
    where: { id: directionId, orgId, deletedAt: null },
  })
  if (!existing) throw new Error('Membre de la direction introuvable ou déjà supprimé')

  await prisma.direction.update({
    where: { id: directionId },
    data: { deletedAt: new Date() },
  })
  await invalidateEvent('DIRECTION_REMOVED', orgId)
}

import { prisma } from '@/lib/prisma'

export async function checkInvitationResources(params: {
  classId: string
  orgId: string
  groupIds?: string[]
}): Promise<{ valid: true } | { valid: false; error: string }> {
  const { classId, orgId, groupIds } = params
  const hasGroups = !!groupIds?.length

  const [foundClass, validGroupCount] = await Promise.all([
    prisma.class.findFirst({
      where: { id: classId, deletedAt: null, academicYear: { orgId, isActive: true } },
      select: { id: true },
    }),
    hasGroups
      ? prisma.group.count({ where: { id: { in: groupIds }, classId, deletedAt: null } })
      : Promise.resolve(null),
  ])

  if (!foundClass) return { valid: false, error: "La classe spécifiée n'existe pas ou n'appartient pas à cette organisation" }
  if (hasGroups && validGroupCount !== groupIds!.length) return { valid: false, error: "Un ou plusieurs groupes sont invalides ou n'appartiennent pas à cette classe" }

  return { valid: true }
}

export async function getClassInvitations(classId: string, orgId: string) {
  return prisma.invitation.findMany({
    where: { orgId, resourceId: classId, resourceType: 'CLASS' },
    select: { id: true, email: true, createdAt: true, expiresAt: true, usedAt: true, details: true },
    orderBy: { createdAt: 'desc' },
    take: 100,
  })
}

import { prisma } from '@/lib/prisma'

export async function getFunctions({ orgId, isMain }: { orgId: string; isMain?: boolean }) {
  return prisma.function.findMany({
    where: { orgId, ...(isMain !== undefined ? { isMain } : {}) },
    orderBy: [{ isMain: 'desc' }, { name: 'asc' }],
  })
}

export async function getMainFunctionsUser(orgId: string) {
  return prisma.function.findMany({
    where: { isMain: true, orgId },
    select: {
      id: true, name: true, description: true, icon: true, isMain: true, createdAt: true, updatedAt: true,
      users: {
        select: {
          assignedAt: true, assignedBy: true,
          user: {
            select: { id: true, firstName: true, lastName: true, email: true, avatar_url: true, status: true },
          },
        },
      },
    },
  })
}

import { prisma } from '@/lib/db'

export async function assignFunction(userId: string, functionId: string, assignedBy: string) {
  return prisma.userFunction.create({
    data: { userId, functionId, assignedBy },
  })
}

export async function unassignFunction(userId: string, functionId: string) {
  return prisma.userFunction.deleteMany({
    where: { userId, functionId },
  })
}

import { prisma } from '@/lib/db'

export async function getUserFunctions(userId: string) {
  return prisma.userFunction.findMany({
    where: { userId },
    include: {
      function: { select: { id: true, name: true, description: true, icon: true } },
    },
  })
}

export async function getUsersByFunction(functionId: string) {
  return prisma.userFunction.findMany({
    where: { functionId },
    include: {
      user: { select: { id: true, firstName: true, lastName: true, email: true } },
    },
  })
}

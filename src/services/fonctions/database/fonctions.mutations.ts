import { prisma } from '@/lib/db'

export interface AddFunctionData {
  name: string
  description?: string
  icon?: string
  orgId: string
  isMain?: boolean
}

export type UpdateFunctionData = Partial<Omit<AddFunctionData, 'orgId'>>

export async function createFunction(data: AddFunctionData) {
  return prisma.function.create({
    data: {
      name: data.name,
      description: data.description,
      icon: data.icon,
      orgId: data.orgId,
      isMain: data.isMain ?? false,
    },
  })
}

export async function updateFunction(functionId: string, data: UpdateFunctionData) {
  return prisma.function.update({
    where: { id: functionId },
    data,
  })
}

export async function deleteFunction(functionId: string) {
  await prisma.function.delete({ where: { id: functionId } })
}

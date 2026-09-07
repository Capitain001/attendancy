// src/services/function/database/function.mutations.ts
import { prisma } from '@/lib/prisma'
import { tryConstraint } from '@/utils/server/prisma'
import { invalidateEvent } from '@/cache/server/key'
import type { CreateFunctionOutput, UpdateFunctionDataOutput } from '../validation'
import { getFunctions, getMissingMainFunctions } from './function.queries'
import { MAIN_FUNCTIONS } from '../constants'

export async function createFunction(data: CreateFunctionOutput & { orgId: string }) {
  const result = await tryConstraint(
    prisma.function.create({
      data: {
        name: data.name,
        orgId: data.orgId,
        description: data.description ?? null,
        icon: data.icon ?? null,
        isMain: data.isMain ?? false,
      },
      select: { id: true, name: true, description: true, icon: true, isMain: true },
    })
  )
  await invalidateEvent('FUNCTION_CREATED', data.orgId)
  return result
}

export async function updateFunction(functionId: string, orgId: string, data: UpdateFunctionDataOutput) {
  const result = await tryConstraint(
    prisma.function.update({
      where: { id: functionId, orgId },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.description !== undefined ? { description: data.description } : {}),
        ...(data.icon !== undefined ? { icon: data.icon } : {}),
        ...(data.isMain !== undefined ? { isMain: data.isMain } : {}),
      },
      select: { id: true, name: true, description: true, icon: true, isMain: true },
    })
  )
  await invalidateEvent('FUNCTION_UPDATED', orgId)
  return result
}
export async function deleteFunction(functionId: string, orgId: string) {
  await tryConstraint(
    prisma.function.delete({ where: { id: functionId, orgId } })
  )
  await invalidateEvent('FUNCTION_DELETED', orgId)
}

export async function assignFunctionToUser(params: {
  userId: string
  functionId: string
  orgId: string
  assignedBy?: string
}) {
  const result = await prisma.userFunction.upsert({
    where: { userId_functionId: { userId: params.userId, functionId: params.functionId } },
    create: {
      userId: params.userId,
      functionId: params.functionId,
      assignedBy: params.assignedBy ?? null,
    },
    update: {},
    select: { id: true, userId: true, functionId: true },
  })
  await invalidateEvent('FUNCTION_ASSIGNED', params.orgId)
  return result
}

export async function deleteFunctionFromUser(params: {
  userId: string
  functionId: string
  orgId: string
}) {
  await prisma.userFunction.delete({
    where: { userId_functionId: { userId: params.userId, functionId: params.functionId } },
  })
  await invalidateEvent('FUNCTION_UNASSIGNED', params.orgId)
}



export async function createMainFunctions(orgId: string) {
  const results = await Promise.all(
    MAIN_FUNCTIONS.map((main) =>
      tryConstraint(
        prisma.function.upsert({
          where: { name_orgId: { name: main.name, orgId } },
          update: { description: main.description, icon: main.icon, isMain: true },
          create: { name: main.name, orgId, description: main.description, icon: main.icon, isMain: true },
          select: { id: true, name: true, description: true, icon: true, isMain: true },
        })
      )
    )
  )
  await invalidateEvent('FUNCTION_CREATED', orgId)
  return results
}


export async function ensureMainFunctions(orgId: string) {
  const missing = await getMissingMainFunctions(orgId)
  if (missing.length === 0) {
    return { created: false, functions: await getFunctions(orgId) }
  }
  return { created: true, functions: await createMainFunctions(orgId) }
}

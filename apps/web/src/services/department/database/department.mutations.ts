// src/services/department/database/department.mutations.ts
import { prisma } from '@/lib/prisma'
import { tryConstraint } from '@/utils/server/prisma'
import { invalidateEvent } from '@/cache/server/key'
import type { CreateDepartmentOutput, UpdateDepartmentOutput } from '../validation'

export async function createDepartment(data: CreateDepartmentOutput & { orgId: string }) {
  const result = await tryConstraint(
    prisma.department.create({
      data: { name: data.name, orgId: data.orgId },
      select: { id: true, name: true, _count: { select: { programTracks: true, teachers: true, ues: true } } },
    })
  )
  await invalidateEvent('DEPARTMENT_CREATED', data.orgId)
  return result
}

export async function updateDepartment({ departmentId, orgId, name }: UpdateDepartmentOutput & { orgId: string }) {
  const result = await tryConstraint(
    prisma.department.update({
      where: { id: departmentId, orgId },
      data: { name },
      select: { id: true, name: true, _count: { select: { programTracks: true, teachers: true, ues: true } } },
    })
  )
  await invalidateEvent('DEPARTMENT_UPDATED', orgId)
  return result
}

export async function deleteDepartment(departmentId: string, orgId: string) {
  await tryConstraint(
    prisma.department.delete({
      where: { id: departmentId, orgId },
    })
  )

  await invalidateEvent('DEPARTMENT_DELETED', orgId)
}
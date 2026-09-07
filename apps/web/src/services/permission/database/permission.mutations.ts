import { prisma } from '@/lib/prisma'
import { tryConstraint } from '@/utils/server/prisma'
import { invalidateEvent } from '@/cache/server/key'
import type { CreatePermissionData } from '../types'

export async function grantPermission(data: CreatePermissionData) {
  const result = await tryConstraint(
    prisma.permission.create({
      data,
      select: { id: true, action: true, resource: true, resourceId: true, userId: true, functionId: true },
    })
  )
  await invalidateEvent('PERMISSION_GRANTED', data.orgId!, data.userId ?? data.functionId ?? undefined)
  return result
}

// Revoke = soft (isActive: false) — le modèle porte déjà isActive, pas
// besoin de deletedAt en plus (cohérent avec le champ existant).
export async function revokePermission(permissionId: string, orgId: string) {
  const result = await tryConstraint(
    prisma.permission.update({
      where: { id: permissionId, orgId },
      data: { isActive: false },
      select: { id: true, userId: true, functionId: true },
    })
  )
  await invalidateEvent('PERMISSION_REVOKED', orgId, result.userId ?? result.functionId ?? undefined)
  return result
}
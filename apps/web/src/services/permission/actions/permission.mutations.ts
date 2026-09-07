// actions.ts
'use server'
import * as v from 'valibot'
import { authAccess } from '@/services/auth'
import { ERRORS } from '@/config'
import { grantPermissionSchema, revokePermissionSchema } from '../validation'
import type { GrantPermissionInput, RevokePermissionInput } from '../validation'
import { grantPermission, revokePermission } from '../database'
import { syncPermissionsMetadataFor } from '@/modules/permission'


export async function grantPermissionAction(input: GrantPermissionInput) {
  const auth = await authAccess({ requiredRole: 'ADMIN' })
  if (!auth.data) return { error: auth.error }
  const { user, orgId } = auth.data
  const parsed = v.safeParse(grantPermissionSchema, input)
  if (!parsed.success) return { error: parsed.issues[0]?.message ?? 'Données invalides' }
  try {
    const permission = await grantPermission({ ...parsed.output, orgId, assignedById: user.id })
    
    await syncPermissionsMetadataFor({ orgId, userId: permission.userId, functionId: permission.functionId })
    return { data: permission }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

export async function revokePermissionAction(input: RevokePermissionInput) {
  const auth = await authAccess({ requiredRole: 'ADMIN' })
  if (!auth.data) return { error: auth.error }
  const { orgId } = auth.data
  const parsed = v.safeParse(revokePermissionSchema, input)
  if (!parsed.success) return { error: parsed.issues[0]?.message ?? 'Données invalides' }
  try {
    const permission = await revokePermission(parsed.output.permissionId, orgId)
    await syncPermissionsMetadataFor({ orgId, userId: permission.userId, functionId: permission.functionId })
    return { data: permission }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}
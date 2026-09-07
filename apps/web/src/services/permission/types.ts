export * from './generated.types'

import type { Action, Resource, Prisma } from '@/generated/prisma/browser'

export type PermissionName =
  | Action
  | `${Action}:${Resource}`
  | `${Action}:${Resource}:${string}`

export type CreatePermissionData = Pick<Prisma.PermissionUncheckedCreateInput,
  'action' | 'resource' | 'resourceId' | 'description' | 'expiresAt' | 'userId' | 'functionId' | 'orgId' | 'assignedById'
>
export type UpdatePermissionData = Partial<Pick<CreatePermissionData, 'action' | 'resource' | 'resourceId' | 'description' | 'expiresAt'>
> & { isActive?: boolean }
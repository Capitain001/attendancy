import * as v from 'valibot'
import { Action, Resource } from '@/generated/prisma/browser'
import type { CreatePermissionData } from './types'

export const grantPermissionSchema = v.pipe(
  v.object({
    action: v.enum_(Action, 'Action invalide'),
    resource: v.optional(v.nullable(v.enum_(Resource, 'Ressource invalide'))),
    resourceId: v.optional(v.nullable(v.pipe(v.string(), v.uuid('ID invalide')))),
    description: v.optional(v.nullable(v.string())),
    expiresAt: v.optional(v.nullable(v.date())),
    userId: v.optional(v.nullable(v.pipe(v.string(), v.uuid('ID invalide')))),
    functionId: v.optional(v.nullable(v.pipe(v.string(), v.uuid('ID invalide')))),
  } satisfies Record<keyof Omit<CreatePermissionData, 'orgId' | 'assignedById'>, unknown>),
  // XOR applicatif — la contrainte DB post-migrate l'impose déjà en base,
  // ceci évite un aller-retour DB juste pour une erreur triviale.
  v.check((d) => Boolean(d.userId) !== Boolean(d.functionId), 'Fournir exactement userId OU functionId, jamais les deux')
)

export type GrantPermissionInput = v.InferInput<typeof grantPermissionSchema>
export type GrantPermissionOutput = v.InferOutput<typeof grantPermissionSchema>

export const revokePermissionSchema = v.object({
  permissionId: v.pipe(v.string(), v.uuid('ID invalide')),
})
export type RevokePermissionInput = v.InferInput<typeof revokePermissionSchema>

export const getUserPermissionsSchema = v.object({
  userId: v.pipe(v.string(), v.uuid('ID utilisateur invalide')),
})
export type GetUserPermissionsInput = v.InferInput<typeof getUserPermissionsSchema>
export type GetUserPermissionsOutput = v.InferOutput<typeof getUserPermissionsSchema>

export const getFunctionPermissionsSchema = v.object({
  functionId: v.pipe(v.string(), v.uuid('ID fonction invalide')),
})
export type GetFunctionPermissionsInput = v.InferInput<typeof getFunctionPermissionsSchema>
export type GetFunctionPermissionsOutput = v.InferOutput<typeof getFunctionPermissionsSchema>
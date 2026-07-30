import * as v from 'valibot'
import { Role } from '@/generated/prisma'

export const userIdSchema = v.object({
  userId: v.pipe(v.string(), v.nonEmpty("L'utilisateur est requis")),
})

export const rolesSchema = v.object({
  roles: v.array(
    v.picklist(Object.values(Role) as [Role, ...Role[]], 'Rôle invalide'),
    'Au moins un rôle est requis'
  ),
})

export const functionIdSchema = v.object({
  functionId: v.pipe(v.string(), v.nonEmpty('La fonction est requise')),
})

export type UserIdInput    = v.InferInput<typeof userIdSchema>
export type RolesInput     = v.InferInput<typeof rolesSchema>
export type FunctionIdInput = v.InferInput<typeof functionIdSchema>

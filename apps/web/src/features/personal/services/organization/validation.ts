// src/features/personal/services/organization/validation.ts
import * as v from 'valibot'
import { PERSONAL_ROLES, type PersonalRole } from '@/modules/auth/constants'

export const personalRoleSchema = v.picklist(PERSONAL_ROLES)
export type PersonalRoleInput = v.InferInput<typeof personalRoleSchema>

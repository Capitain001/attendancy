'use server'
import * as v from 'valibot'

import { authAccess } from "@/modules/auth"
import { UpdatePersonalClassInput, updatePersonalClassSchema } from "../validation"
import { updatePersonalClass } from '../database'

export async function updatePersonalClassAction(input: UpdatePersonalClassInput) {
  const auth = await authAccess({ requiredRole: 'TEACHER', requiredOrgType: 'PERSONAL' })
  if (!auth.data) return { error: auth.error }

  const parsed = v.safeParse(updatePersonalClassSchema, input)
  if (!parsed.success) return { error: parsed.issues[0]?.message ?? 'Données invalides' }

  const result = await updatePersonalClass(parsed.output.classId, auth.data.orgId, parsed.output.data)
  return { data: result }
}
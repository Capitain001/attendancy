'use server'

import { authAccess } from "@/modules/auth"
import { getDefaultPersonalClass } from "../database"
import { ERRORS } from "@/config"

export async function getDefaultPersonalClassAction() {
  const auth = await authAccess({ requiredRole: 'TEACHER', requiredOrgType: 'PERSONAL' })
  if (!auth.data) return { error: auth.error }

  try {
    return { data: await getDefaultPersonalClass(auth.data.orgId) }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}
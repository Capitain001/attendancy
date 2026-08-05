'use server'
import { authAccess } from '@/services/auth'
import { ERRORS } from '@/config'
import { getOrgAuditLogs } from '@/modules/audit'

export async function getOrgAuditLogsAction(params?: {
  resource?: string
  action?: string
  cursor?: string
  limit?: number
}) {
  const auth = await authAccess({ requiredRole: ['DIRECTION', 'ADMIN'] })
  if (!auth.data) return { error: auth.error ?? ERRORS.SERVER }
  const { orgId } = auth.data

  try {
    const data = await getOrgAuditLogs({ orgId, ...params })
    return { data }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

'use server'
import { getUserInfo } from '@/services/user/userInfo'
import { getAuthorization } from '@/services/auth/authorization'
import { ERRORS } from '@/config'
import { removeUEFromProgramByComposite } from '@/services/program-track/database'

export async function removeUEFromProgramAction({
  programId,
  ueId,
}: {
  programId: string
  ueId: string
}) {
  try {
    const user = await getUserInfo()
    if (!user?.id) return { error: ERRORS.AUTH.UNAUTHORIZED }
    const orgId = user.organization?.id
    if (!orgId) return { error: ERRORS.ORG.NOT_FOUND }
    const auth = getAuthorization(user, 'DIRECTION')
    if (!auth.success) return { error: auth.error }

    const result = await removeUEFromProgramByComposite(programId, ueId, orgId)
    return { data: result }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

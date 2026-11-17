import { authAccess } from "@/modules/auth"
import { getChannelMember, isChannelMember } from "../database"
import { ERRORS } from "@/config"



export async function getChannelMemberAction(channelId: string) {
  const auth = await authAccess()
  if (!auth.data) return { error: auth.error }
  const { user, orgId } = auth.data

  if (!(await isChannelMember({ channelId, userId: user.id, orgId }))) {
    return { error: 'Accès refusé au canal' }
  }

  try {
    return { data: await getChannelMember(channelId) }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

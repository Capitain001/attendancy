// src/services/chat/actions/message.queries.ts
'use server'
import { authAccess } from '@/services/auth'
import { ERRORS } from '@/config'
import { getMessages, getRoomParticipants  } from '../database'
import { isChannelMember } from '@/services/channel-member/server'

export async function getMessagesAction(channelId: string) {
  const auth = await authAccess()
  if (!auth.data) return { error: auth.error }
  const { user, orgId } = auth.data
  if (!(await isChannelMember({ channelId, userId: user.id, orgId }))) {
    return { error: 'Accès refusé au canal' }
  }

  try {
    return { data: await getMessages(channelId) }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

export async function getRoomParticipantsAction(channelId: string) {
  const auth = await authAccess()
  if (!auth.data) return { error: auth.error }
  const { user, orgId } = auth.data
  if (!(await isChannelMember({ channelId, userId: user.id, orgId }))) {
    return { error: 'Accès refusé au canal' }
  }

  try {
    return { data: await getRoomParticipants(channelId) }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

// export async function getMyClassChannelsAction() {
//   const auth = await authAccess()
//   if (!auth.data) return { error: auth.error }

//   try {
//     return {
//       data: await getMyClassChannels({
//         orgId: auth.data.orgId,
//         userId: auth.data.user.id,
//       }),
//     }
//   } catch (e) {
//     return { error: e instanceof Error ? e.message : ERRORS.SERVER }
//   }
// }

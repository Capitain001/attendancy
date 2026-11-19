import {
  getChannelMember,
  getChannelMemberIds,
  getChannelRecipients,
  getChannelMuteByUser,
  updateChannelMuteByUser,
} from './database'

export type GetChannelMemberDto = Awaited<ReturnType<typeof getChannelMember>>
export type GetChannelMemberIdsDto = Awaited<ReturnType<typeof getChannelMemberIds>>
export type GetChannelRecipientsDto = Awaited<ReturnType<typeof getChannelRecipients>>
export type GetChannelMuteByUserDto = Awaited<ReturnType<typeof getChannelMuteByUser>>
export type UpdateChannelMuteByUserDto = Awaited<ReturnType<typeof updateChannelMuteByUser>>


import { getChannel, getChannels } from './database'

export type GetChannelsDto = Awaited<ReturnType<typeof getChannels>>
export type GetChannelDto = Awaited<ReturnType<typeof getChannel>>

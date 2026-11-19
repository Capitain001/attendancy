import { getEntityQueryKey } from '@/hooks/entity'

export const messagesKey = (channelId: string) => getEntityQueryKey('messages', { channelId })

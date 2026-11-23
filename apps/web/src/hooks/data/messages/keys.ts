import { getEntityQueryKey } from '@/hooks/entity/useEntity'

export const messagesKey = (channelId: string) => getEntityQueryKey('messages', { channelId })

import { describe, expect, it } from 'vitest'
import { messagesKey } from '../keys'
import { getEntityQueryKey } from '@/hooks/entity'

describe('messagesKey', () => {
  it('construit la même clé de requête que getEntityQueryKey', () => {
    const channelId = 'channel-test-123'
    const fromKeys = messagesKey(channelId)
    const fromEntity = getEntityQueryKey('messages', { channelId })

    expect(fromKeys).toEqual(fromEntity)
    expect(fromKeys).toEqual(['messages', { channelId }])
  })
})

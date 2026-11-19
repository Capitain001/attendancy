import { describe, expect, it } from 'vitest'
import { getEntityQueryKey } from '../useEntity'

describe('getEntityQueryKey', () => {
  it('construit la clé sans paramètres', () => {
    expect(getEntityQueryKey('messages')).toEqual(['messages'])
  })

  it('construit la clé avec paramètres', () => {
    expect(getEntityQueryKey('messages', { channelId: 'c1' })).toEqual([
      'messages',
      { channelId: 'c1' },
    ])
  })

  it('ignore les paramètres falsy (undefined, null, chaîne vide)', () => {
    expect(getEntityQueryKey('messages', undefined)).toEqual(['messages'])
    expect(getEntityQueryKey('messages', null)).toEqual(['messages'])
    expect(getEntityQueryKey('messages', '')).toEqual(['messages'])
  })

  it('produit une clé identique pour deux appels avec les mêmes paramètres', () => {
    const k1 = getEntityQueryKey('messages', { channelId: 'c1' })
    const k2 = getEntityQueryKey('messages', { channelId: 'c1' })
    expect(k1).toEqual(k2)
  })
})

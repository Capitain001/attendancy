//apps\web\src\modules\chat\host-profile.test.ts
import { describe, expect, it } from 'vitest'
import { buildHostOptions } from './host-profile'

const users = (n: number) => Array.from({ length: n }, (_, i) => `u${i}`)

describe('buildHostOptions', () => {
  it('DM : 1 pair + marge = 3 connexions', () => {
    const o = buildHostOptions({
      kind: 'dm',
      hostUserId: 'prof',
      channels: [{ id: 'dm1', memberIds: ['prof', 'a'] }],
    })
    expect(o.maxConnections).toBe(3)
    expect(o.maxPendingHello).toBe(3)
  })

  it('classe de 60 : effectif + 20 %, connexions sans hello plafonnées', () => {
    const o = buildHostOptions({
      kind: 'class',
      hostUserId: 'prof',
      channels: [{ id: 'c1', memberIds: users(60) }],
    })
    expect(o.maxConnections).toBe(72)
    expect(o.maxPendingHello).toBe(64)
  })

  it('l\'hôte est ajouté à chaque canal et n\'est pas compté comme pair', () => {
    const o = buildHostOptions({
      kind: 'room',
      hostUserId: 'prof',
      channels: [
        { id: 'c1', memberIds: ['a', 'b'] },
        { id: 'c2', memberIds: ['b', 'c'] },
      ],
    })
    expect(o.members.c1).toContain('prof')
    expect(o.members.c2).toContain('prof')
    expect(o.maxConnections).toBe(3 + 2) // a, b, c + marge minimale
  })

  it('un canal répété fusionne ses membres', () => {
    const o = buildHostOptions({
      kind: 'class',
      hostUserId: 'prof',
      channels: [
        { id: 'c1', memberIds: ['a'] },
        { id: 'c1', memberIds: ['b'] },
      ],
    })
    expect([...o.members.c1].sort()).toEqual(['a', 'b', 'prof'])
  })

  it('le plafond du relais n\'est pas dépassé', () => {
    const o = buildHostOptions({
      kind: 'class',
      hostUserId: 'prof',
      channels: [{ id: 'c1', memberIds: users(1000) }],
    })
    expect(o.maxConnections).toBe(256)
  })

  it('un hôte seul garde au moins la marge minimale', () => {
    const o = buildHostOptions({
      kind: 'room',
      hostUserId: 'prof',
      channels: [{ id: 'c1', memberIds: [] }],
    })
    expect(o.maxConnections).toBe(2)
  })

  it('refuse les profils invalides', () => {
    const ok = { kind: 'class' as const, hostUserId: 'prof', channels: [{ id: 'c1', memberIds: ['a'] }] }
    expect(() => buildHostOptions({ ...ok, hostUserId: '' })).toThrow(RangeError)
    expect(() => buildHostOptions({ ...ok, channels: [] })).toThrow(RangeError)
    expect(() => buildHostOptions({ ...ok, channels: [{ id: '', memberIds: [] }] })).toThrow(RangeError)
    expect(() =>
      buildHostOptions({ ...ok, kind: 'dm', channels: [ok.channels[0], { id: 'c2', memberIds: [] }] }),
    ).toThrow(RangeError)
  })
})

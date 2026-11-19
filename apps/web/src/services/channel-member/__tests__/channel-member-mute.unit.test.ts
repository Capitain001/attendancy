import { beforeEach, describe, expect, it, vi } from 'vitest'

const {
  authAccess,
  getChannelMuteByUser,
  updateChannelMuteByUser,
} = vi.hoisted(() => ({
  authAccess: vi.fn(),
  getChannelMuteByUser: vi.fn(),
  updateChannelMuteByUser: vi.fn(),
}))

vi.mock('@/services/auth', () => ({ authAccess }))
vi.mock('../database', () => ({
  getChannelMuteByUser,
  updateChannelMuteByUser,
  isChannelMember: vi.fn(),
  getChannelMember: vi.fn(),
}))

import { getChannelMuteByUserAction } from '../actions/channel-member.queries'
import { updateChannelMuteByUserAction } from '../actions/channel-member.mutations'

describe('channel-member mute actions', () => {
  const validChannelId = '11111111-1111-4111-8111-111111111111'
  const userId = 'user-123'
  const orgId = 'org-456'

  beforeEach(() => {
    vi.clearAllMocks()
    authAccess.mockResolvedValue({
      data: { user: { id: userId }, orgId },
    })
  })

  describe('getChannelMuteByUserAction', () => {
    it('refuse si non authentifié', async () => {
      authAccess.mockResolvedValue({ data: null, error: 'Non authentifié' })

      const res = await getChannelMuteByUserAction({ channelId: validChannelId })
      expect(res).toEqual({ error: 'Non authentifié' })
      expect(getChannelMuteByUser).not.toHaveBeenCalled()
    })

    it('refuse si le channelId n est pas un UUID', async () => {
      const res = await getChannelMuteByUserAction({ channelId: 'not-a-uuid' })
      expect(res).toHaveProperty('error')
      expect(getChannelMuteByUser).not.toHaveBeenCalled()
    })

    it('refuse si l utilisateur n est pas membre du canal dans l organisation', async () => {
      getChannelMuteByUser.mockResolvedValue(null)

      const res = await getChannelMuteByUserAction({ channelId: validChannelId })
      expect(res).toEqual({ error: 'Accès refusé' })
      expect(getChannelMuteByUser).toHaveBeenCalledWith({
        channelId: validChannelId,
        userId,
        orgId,
      })
    })

    it('renvoie muted: false si mutedAt est null', async () => {
      getChannelMuteByUser.mockResolvedValue({ mutedAt: null })

      const res = await getChannelMuteByUserAction({ channelId: validChannelId })
      expect(res).toEqual({ data: { muted: false } })
    })

    it('renvoie muted: true si mutedAt est non-null', async () => {
      getChannelMuteByUser.mockResolvedValue({ mutedAt: new Date() })

      const res = await getChannelMuteByUserAction({ channelId: validChannelId })
      expect(res).toEqual({ data: { muted: true } })
    })
  })

  describe('updateChannelMuteByUserAction', () => {
    it('refuse si non authentifié', async () => {
      authAccess.mockResolvedValue({ data: null, error: 'Non authentifié' })

      const res = await updateChannelMuteByUserAction({
        channelId: validChannelId,
        data: { muted: true },
      })
      expect(res).toEqual({ error: 'Non authentifié' })
      expect(updateChannelMuteByUser).not.toHaveBeenCalled()
    })

    it('refuse si l input est invalide', async () => {
      const res = await updateChannelMuteByUserAction({
        channelId: 'not-a-uuid',
        data: { muted: true },
      })
      expect(res).toHaveProperty('error')
      expect(updateChannelMuteByUser).not.toHaveBeenCalled()
    })

    it('refuse si l utilisateur n est pas membre du canal (count = 0)', async () => {
      updateChannelMuteByUser.mockResolvedValue({ count: 0 })

      const res = await updateChannelMuteByUserAction({
        channelId: validChannelId,
        data: { muted: true },
      })
      expect(res).toEqual({ error: 'Accès refusé' })
      expect(updateChannelMuteByUser).toHaveBeenCalledWith(
        { channelId: validChannelId, userId, orgId },
        { muted: true },
      )
    })

    it('active la sourdine et renvoie muted: true', async () => {
      updateChannelMuteByUser.mockResolvedValue({ count: 1 })

      const res = await updateChannelMuteByUserAction({
        channelId: validChannelId,
        data: { muted: true },
      })
      expect(res).toEqual({ data: { muted: true } })
      expect(updateChannelMuteByUser).toHaveBeenCalledWith(
        { channelId: validChannelId, userId, orgId },
        { muted: true },
      )
    })

    it('désactive la sourdine et renvoie muted: false', async () => {
      updateChannelMuteByUser.mockResolvedValue({ count: 1 })

      const res = await updateChannelMuteByUserAction({
        channelId: validChannelId,
        data: { muted: false },
      })
      expect(res).toEqual({ data: { muted: false } })
      expect(updateChannelMuteByUser).toHaveBeenCalledWith(
        { channelId: validChannelId, userId, orgId },
        { muted: false },
      )
    })
  })
})

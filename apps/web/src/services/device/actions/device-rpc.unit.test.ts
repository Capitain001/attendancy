import { beforeEach, describe, expect, it, vi } from 'vitest'

const {
  getUserInfo,
  headers,
  captureDeviceSession,
  endSessionForUser,
} = vi.hoisted(() => ({
  getUserInfo: vi.fn(),
  headers: vi.fn(),
  captureDeviceSession: vi.fn(),
  endSessionForUser: vi.fn(),
}))

vi.mock('next/headers', () => ({ headers }))
vi.mock('@/modules/user', () => ({ getUserInfo }))
vi.mock('../server/device-session', () => ({ captureDeviceSession, endSessionForUser }))

import { endSessionAction, registerDeviceAction } from './device.rpc'

const tokenWithSessionId = `header.${Buffer.from(JSON.stringify({ session_id: 'session-from-bearer' })).toString('base64url')}.signature`

describe('device RPC actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getUserInfo.mockResolvedValue({ id: 'authenticated-user-id' })
    headers.mockResolvedValue({
      get: (name: string) => name === 'authorization' ? `Bearer ${tokenWithSessionId}` : null,
    })
  })

  it('rejects invalid device ids before reading identity or writing sessions', async () => {
    const result = await registerDeviceAction({ deviceId: 'short' })

    expect(result).toHaveProperty('error')
    expect(getUserInfo).not.toHaveBeenCalled()
    expect(captureDeviceSession).not.toHaveBeenCalled()
  })

  it('derives the session owner from the authenticated identity, not client input', async () => {
    captureDeviceSession.mockResolvedValue({ data: true })

    const result = await registerDeviceAction({
      deviceId: 'desktop-device-id',
      userId: 'attacker-selected-user-id',
    } as { deviceId: string })

    expect(result).toEqual({ data: true })
    expect(getUserInfo).toHaveBeenCalledWith({ cache: false })
    expect(captureDeviceSession).toHaveBeenCalledWith({
      userId: 'authenticated-user-id',
      deviceId: 'desktop-device-id',
      authSessionId: 'session-from-bearer',
    })
  })

  it('rejects unauthenticated registration and logout requests', async () => {
    getUserInfo.mockResolvedValue(null)

    const registerResult = await registerDeviceAction({ deviceId: 'desktop-device-id' })
    const logoutResult = await endSessionAction({ deviceId: 'desktop-device-id' })

    expect(registerResult).toHaveProperty('error')
    expect(logoutResult).toHaveProperty('error')
    expect(captureDeviceSession).not.toHaveBeenCalled()
    expect(endSessionForUser).not.toHaveBeenCalled()
  })

  it('expires sessions only for the current identity and provided device', async () => {
    endSessionForUser.mockResolvedValue({ data: true })

    const result = await endSessionAction({ deviceId: 'desktop-device-id' })

    expect(result).toEqual({ data: true })
    expect(endSessionForUser).toHaveBeenCalledWith({
      userId: 'authenticated-user-id',
      deviceId: 'desktop-device-id',
    })
  })
})

import { randomUUID } from 'node:crypto'
import { PrismaClient } from '@/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { expireSessionOnLogout, upsertDeviceOnLogin } from './device.mutations'

const testDatabaseUrl = process.env.DATABASE_URL
if (!testDatabaseUrl) {
  throw new Error('DATABASE_URL must point to TEST_DATABASE_URL for integration tests')
}

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: testDatabaseUrl }) })
const suffix = randomUUID()
const sharedDeviceId = `integration-device-${suffix}`
const userEmails = [`device-owner-${suffix}@test.local`, `other-owner-${suffix}@test.local`]
let userIds: string[] = []

beforeAll(async () => {
  const users = await Promise.all(
    userEmails.map((email) => db.user.create({ data: { email }, select: { id: true } })),
  )
  userIds = users.map(({ id }) => id)
})

afterAll(async () => {
  if (userIds.length) {
    await db.userSession.deleteMany({ where: { userId: { in: userIds } } })
    await db.userDevice.deleteMany({ where: { userId: { in: userIds } } })
    await db.user.deleteMany({ where: { id: { in: userIds } } })
  }
  await db.$disconnect()
})

describe('device session lifecycle — integration DB', () => {
  it('registers sessions per user and expires only the authenticated user device sessions on logout', async () => {
    const [ownerId, otherUserId] = userIds

    const ownerLogin = await upsertDeviceOnLogin({
      userId: ownerId,
      deviceId: sharedDeviceId,
      userAgent: null,
      ipAddress: null,
      authSessionId: `auth-${suffix}-1`,
    })
    const ownerSecondLogin = await upsertDeviceOnLogin({
      userId: ownerId,
      deviceId: sharedDeviceId,
      userAgent: null,
      ipAddress: null,
      authSessionId: `auth-${suffix}-2`,
    })
    const otherUserLogin = await upsertDeviceOnLogin({
      userId: otherUserId,
      deviceId: sharedDeviceId,
      userAgent: null,
      ipAddress: null,
      authSessionId: `auth-${suffix}-other`,
    })

    expect(ownerSecondLogin.device.id).toBe(ownerLogin.device.id)
    expect(ownerSecondLogin.session.id).not.toBe(ownerLogin.session.id)
    expect(otherUserLogin.device.id).not.toBe(ownerLogin.device.id)

    const result = await expireSessionOnLogout(ownerId, sharedDeviceId)

    expect(result.count).toBe(2)
    const [ownerSessions, otherUserSessions] = await Promise.all([
      db.userSession.findMany({
        where: { userId: ownerId },
        orderBy: { createdAt: 'asc' },
        select: { status: true, revokedReason: true },
      }),
      db.userSession.findMany({
        where: { userId: otherUserId },
        select: { status: true, revokedReason: true },
      }),
    ])

    expect(ownerSessions).toHaveLength(2)
    expect(ownerSessions.every(({ status, revokedReason }) =>
      status === 'EXPIRED' && revokedReason === 'USER_LOGOUT',
    )).toBe(true)
    expect(otherUserSessions).toEqual([{ status: 'ACTIVE', revokedReason: null }])
  })
})

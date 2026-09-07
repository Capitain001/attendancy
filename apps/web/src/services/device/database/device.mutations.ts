import { UAParser } from 'ua-parser-js'
import { prisma } from '@/lib/prisma'
import { tryConstraint } from '@/utils/server/prisma'
import { invalidateEvent } from '@/cache/server/key'
import type { DeviceType, SessionRevokeReason } from '@/generated/prisma/client'

// Mappe le type ua-parser-js sur l'enum Prisma — parsing isolé ici, pas dans
// les actions (SKILL.md : Prisma + data-shaping du write restent en database/).
function toDeviceType(uaDeviceType?: string): DeviceType {
  if (uaDeviceType === 'mobile') return 'MOBILE'
  if (uaDeviceType === 'tablet') return 'TABLET'
  if (uaDeviceType === undefined) return 'DESKTOP' // pas de "device.type" chez ua-parser = poste fixe
  return 'UNKNOWN'
}

export async function upsertDeviceOnLogin(input: {
  userId: string
  deviceId: string
  userAgent: string | null
  ipAddress: string | null
  authSessionId: string | null
}) {
  const { userId, deviceId, userAgent, ipAddress, authSessionId } = input
  const ua = userAgent ? new UAParser(userAgent).getResult() : null

  const device = await tryConstraint(
    prisma.userDevice.upsert({
      where: { userId_deviceId: { userId, deviceId } },
      create: {
        userId,
        deviceId,
        deviceType: toDeviceType(ua?.device.type),
        os: ua?.os.name ?? null,
        osVersion: ua?.os.version ?? null,
        browser: ua?.browser.name ?? null,
        browserVersion: ua?.browser.version ?? null,
        lastIpAddress: ipAddress,
      },
      update: {
        lastSeenAt: new Date(),
        lastIpAddress: ipAddress,
        // revokedAt n'est PAS remis à null ici : un device révoqué qui
        // reconnecte ne redevient pas "de confiance" silencieusement — la
        // levée de revocation est un acte explicite, non exposé pour
        // l'instant (pas de besoin métier identifié).
      },
      select: { id: true, revokedAt: true },
    }),
  )

  const session = await tryConstraint(
    prisma.userSession.create({
      data: {
        userId,
        deviceId: device.id,
        ipAddress,
        userAgent,
        authSessionId,
      },
      select: { id: true, deviceId: true, createdAt: true },
    }),
  )

  await invalidateEvent('DEVICE_SESSION_CREATED', userId)
  return { device, session }
}

// Clôture "naturelle" (logout explicite) — status EXPIRED, pas REVOKED :
// REVOKED est réservé à une action volontaire depuis l'écran de gestion des
// appareils (revokeSession / revokeDevice ci-dessous).
export async function expireSessionOnLogout(userId: string, deviceId: string) {
  const session = await tryConstraint(
    prisma.userSession.updateMany({
      where: { userId, device: { deviceId }, status: 'ACTIVE' },
      data: { status: 'EXPIRED', revokedAt: new Date(), revokedReason: 'USER_LOGOUT' },
    }),
  )

  await invalidateEvent('DEVICE_SESSION_ENDED', userId)
  return session
}

export async function revokeSession(
  sessionId: string,
  userId: string,
  reason: SessionRevokeReason,
) {
  const session = await tryConstraint(
    prisma.userSession.update({
      where: { id: sessionId, userId },
      data: { status: 'REVOKED', revokedAt: new Date(), revokedReason: reason },
      select: { id: true, deviceId: true, authSessionId: true },
    }),
  )

  await invalidateEvent('DEVICE_SESSION_REVOKED', userId)
  return session
}

export async function revokeDevice(
  deviceId: string,
  userId: string,
  reason: SessionRevokeReason,
) {
  const [device] = await prisma.$transaction([
    prisma.userDevice.update({
      where: { id: deviceId, userId },
      data: { revokedAt: new Date() },
      select: { id: true },
    }),
    prisma.userSession.updateMany({
      where: { deviceId, userId, status: 'ACTIVE' },
      data: { status: 'REVOKED', revokedAt: new Date(), revokedReason: reason },
    }),
  ])

  await invalidateEvent('DEVICE_REVOKED', userId)
  return device
}

export async function touchSessionActivity(sessionId: string) {
  return tryConstraint(
    prisma.userSession.update({
      where: { id: sessionId, status: 'ACTIVE' },
      data: { lastActivityAt: new Date() },
      select: { id: true },
    }),
  )
}

export async function updateDeviceLabel(deviceId: string, userId: string, label: string | null) {
  const device = await tryConstraint(
    prisma.userDevice.update({
      where: { id: deviceId, userId },
      data: { label },
      select: { id: true, label: true },
    }),
  )
  await invalidateEvent('DEVICE_UPDATED', userId)
  return device
}

export async function setDeviceTrusted(deviceId: string, userId: string, isTrusted: boolean) {
  const device = await tryConstraint(
    prisma.userDevice.update({
      where: { id: deviceId, userId },
      data: { isTrusted },
      select: { id: true, isTrusted: true },
    }),
  )
  await invalidateEvent('DEVICE_UPDATED', userId)
  return device
}
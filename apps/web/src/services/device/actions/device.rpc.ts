// src/services/device/actions/device.rpc.ts
'use server'
import { headers } from 'next/headers'
import { getUserInfo } from '@/modules/user'
import { ERRORS } from '@/config'
import * as v from 'valibot'
import { getSessionIdFromAccessToken } from '../utils'
import { captureDeviceSession, endSessionForUser } from '../server/device-session'
import { deviceIdInputSchema, type DeviceIdInput } from '../validation'

// userId vient du token, jamais de l'input. deviceId vient du client.
export async function registerDeviceAction(input: DeviceIdInput) {
  const parsed = v.safeParse(deviceIdInputSchema, input)
  if (!parsed.success) return { error: parsed.issues[0]?.message ?? 'Données invalides' }

  const user = await getUserInfo({ cache: false })
  if (!user?.id) return { error: ERRORS.AUTH.UNAUTHORIZED }

  const bearer = (await headers()).get('authorization')?.slice(7)
  const authSessionId = bearer ? getSessionIdFromAccessToken(bearer) ?? undefined : undefined

  return captureDeviceSession({
    userId: user.id,
    deviceId: parsed.output.deviceId,
    authSessionId,
  })
}

export async function endSessionAction(input: DeviceIdInput) {
  const parsed = v.safeParse(deviceIdInputSchema, input)
  if (!parsed.success) return { error: parsed.issues[0]?.message ?? 'Données invalides' }

  const user = await getUserInfo({ cache: false })
  if (!user?.id) return { error: ERRORS.AUTH.UNAUTHORIZED }
  return endSessionForUser({ userId: user.id, deviceId: parsed.output.deviceId })
}

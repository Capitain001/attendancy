import 'server-only'
import { cookies, headers } from 'next/headers'
import * as v from 'valibot'
import { ERRORS } from '@/config'
import { resolveDeviceId } from '@/lib/device'
import { getSessionIdFromAccessToken } from '../utils'
import {
  captureLoginDeviceSchema,
  endSessionOnLogoutSchema,
  type CaptureLoginDeviceInput,
  type EndSessionOnLogoutInput,
} from '../validation'
import { expireSessionOnLogout, upsertDeviceOnLogin } from '../database'

function extractRequestMeta(headersList: Awaited<ReturnType<typeof headers>>) {
  const userAgent = headersList.get('user-agent')
  const ipAddress =
    headersList.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    headersList.get('x-real-ip') ??
    null

  return { userAgent, ipAddress }
}

export async function captureDeviceSession(input: CaptureLoginDeviceInput) {
  const parsed = v.safeParse(captureLoginDeviceSchema, input)
  if (!parsed.success) {
    return { error: parsed.issues[0]?.message ?? 'Données invalides' }
  }

  try {
    const requestHeaders = await headers()
    const { userAgent, ipAddress } = extractRequestMeta(requestHeaders)
    const result = await upsertDeviceOnLogin({
      ...parsed.output,
      authSessionId: parsed.output.authSessionId ?? null,
      userAgent,
      ipAddress,
    })

    return { data: result }
  } catch (error) {
    return { error: error instanceof Error ? error.message : ERRORS.SERVER }
  }
}

export async function captureLoginDevice(userId: string, accessToken: string) {
  const cookieStore = await cookies()
  const deviceId = resolveDeviceId(cookieStore)
  const authSessionId = getSessionIdFromAccessToken(accessToken) ?? undefined

  return captureDeviceSession({ userId, deviceId, authSessionId })
}

export async function endSessionForUser(input: EndSessionOnLogoutInput) {
  const parsed = v.safeParse(endSessionOnLogoutSchema, input)
  if (!parsed.success) {
    return { error: parsed.issues[0]?.message ?? 'Données invalides' }
  }

  try {
    await expireSessionOnLogout(parsed.output.userId, parsed.output.deviceId)
    return { data: true }
  } catch (error) {
    return { error: error instanceof Error ? error.message : ERRORS.SERVER }
  }
}

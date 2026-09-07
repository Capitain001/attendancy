import type { NextRequest, NextResponse } from 'next/server'
import type { ReadonlyRequestCookies } from 'next/dist/server/web/spec-extension/adapters/request-cookies'

export const DEVICE_ID_COOKIE = 'device_id'
const DEVICE_ID_MAX_AGE = 60 * 60 * 24 * 365 * 2 // 2 ans

const DEVICE_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: DEVICE_ID_MAX_AGE,
  path: '/',
}

/**
 * Middleware Edge : lit le device_id depuis la requête, en génère un si absent.
 * Doit être appelé AVANT NextResponse.next({ request }) pour que les Server
 * Actions aval le lisent via cookies().
 */
export function getOrGenerateDeviceId(request: NextRequest): { deviceId: string; isNew: boolean } {
  const existing = request.cookies.get(DEVICE_ID_COOKIE)?.value
  if (existing) return { deviceId: existing, isNew: false }

  const deviceId = crypto.randomUUID()
  request.cookies.set(DEVICE_ID_COOKIE, deviceId)
  return { deviceId, isNew: true }
}

/**
 * Middleware Edge : pose le cookie sur la réponse sortante pour le navigateur.
 */
export function setDeviceIdCookieOnResponse(response: NextResponse, deviceId: string): void {
  response.cookies.set(DEVICE_ID_COOKIE, deviceId, DEVICE_COOKIE_OPTIONS)
}

/**
 * Server Action : lit le device_id depuis le cookie store, en génère et pose
 * un si absent (cas du tout premier login où le navigateur n'a pas encore
 * renvoyé le cookie posé par le middleware dans la réponse précédente).
 */
export function resolveDeviceId(cookieStore: ReadonlyRequestCookies): string {
  const existing = cookieStore.get(DEVICE_ID_COOKIE)?.value
  if (existing) return existing

  const deviceId = crypto.randomUUID()
  cookieStore.set(DEVICE_ID_COOKIE, deviceId, DEVICE_COOKIE_OPTIONS)
  return deviceId
}
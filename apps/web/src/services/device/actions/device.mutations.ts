'use server'
import { headers, cookies } from 'next/headers'
import * as v from 'valibot'
import { authAccess } from '@/services/auth'
import { ERRORS } from '@/config'
import { logAuditAsync } from '@/utils/server/audit'
import { resolveDeviceId } from '@/lib/device'
import { getSessionIdFromAccessToken } from '../utils'
import {
  captureLoginDeviceSchema,
  endSessionOnLogoutSchema,
  revokeSessionSchema,
  revokeDeviceSchema,
  updateDeviceLabelSchema,
  setDeviceTrustedSchema,
  type CaptureLoginDeviceInput,
  type EndSessionOnLogoutInput,
  type RevokeSessionInput,
  type RevokeDeviceInput,
  type UpdateDeviceLabelInput,
  type SetDeviceTrustedInput,
} from '../validation'
import { upsertDeviceOnLogin, expireSessionOnLogout, revokeSession, revokeDevice, updateDeviceLabel, setDeviceTrusted } from '../database'

function extractRequestMeta(headersList: Awaited<ReturnType<typeof headers>>) {
  const userAgent = headersList.get('user-agent')
  const ipAddress =
    headersList.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    headersList.get('x-real-ip') ??
    null
  return { userAgent, ipAddress }
}

// Pas d'authAccess ici : appelée juste après un login Supabase réussi, avant
// que le contexte de session applicatif soit établi. userId vient directement
// de l'appelant (login.ts), qui vient lui-même de vérifier l'identité.
// ⚠️ Ne jamais exposer cette action à un formulaire/bouton client — elle
// n'est destinée qu'à être appelée depuis d'autres server actions du module
// auth, jamais directement par l'utilisateur.
export async function captureLoginDeviceAction(input: CaptureLoginDeviceInput) {
  const parsed = v.safeParse(captureLoginDeviceSchema, input)
  if (!parsed.success) return { error: parsed.issues[0]?.message ?? 'Données invalides' }

  try {
    const headersList = await headers()
    const { userAgent, ipAddress } = extractRequestMeta(headersList)
    const result = await upsertDeviceOnLogin({
      ...parsed.output,
      authSessionId: parsed.output.authSessionId ?? null,
      userAgent,
      ipAddress,
    })
    return { data: result }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

// Façade pour login.ts : résout le device_id (cookie ou génération fallback),
// extrait le session_id du JWT, puis délègue à captureLoginDeviceAction.
// L'appelant n'a besoin de passer que les deux identités issues du login.
export async function captureLoginDevice(userId: string, accessToken: string) {
  const cookieStore = await cookies()
  const deviceId = resolveDeviceId(cookieStore)
  const authSessionId = getSessionIdFromAccessToken(accessToken) ?? undefined
  return captureLoginDeviceAction({ userId, deviceId, authSessionId })
}

// Même logique : appelée depuis logout.ts, pas de authAccess (le logout
// Supabase peut avoir déjà été déclenché par ailleurs).
export async function endSessionOnLogoutAction(input: EndSessionOnLogoutInput) {
  const parsed = v.safeParse(endSessionOnLogoutSchema, input)
  if (!parsed.success) return { error: parsed.issues[0]?.message ?? 'Données invalides' }

  try {
    await expireSessionOnLogout(parsed.output.userId, parsed.output.deviceId)
    return { data: true }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

// Écran "mes appareils" — révocation d'UNE session précise.
export async function revokeSessionAction(input: RevokeSessionInput) {
  const auth = await authAccess()
  if (!auth.data) return { error: auth.error }
  const { user } = auth.data

  const parsed = v.safeParse(revokeSessionSchema, input)
  if (!parsed.success) return { error: parsed.issues[0]?.message ?? 'Données invalides' }

  try {
    const session = await revokeSession(parsed.output.sessionId, user.id, 'USER_REVOKED_DEVICE')
    await logAuditAsync({
      userId: user.id,
      action: 'DELETE',
      resource: 'SESSION',
      resourceId: session.id,
    })
    return { data: session }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

// Écran "mes appareils" — révocation d'un appareil entier (toutes sessions).
export async function revokeDeviceAction(input: RevokeDeviceInput) {
  const auth = await authAccess()
  if (!auth.data) return { error: auth.error }
  const { user } = auth.data

  const parsed = v.safeParse(revokeDeviceSchema, input)
  if (!parsed.success) return { error: parsed.issues[0]?.message ?? 'Données invalides' }

  try {
    const device = await revokeDevice(parsed.output.deviceId, user.id, 'USER_REVOKED_DEVICE')
    await logAuditAsync({
      userId: user.id,
      action: 'DELETE',
      resource: 'USER_DEVICE',
      resourceId: device.id,
    })
    return { data: device }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

// Renommer un appareil (label affiché à l'utilisateur).
export async function updateDeviceLabelAction(input: UpdateDeviceLabelInput) {
  const auth = await authAccess()
  if (!auth.data) return { error: auth.error }
  const { user } = auth.data

  const parsed = v.safeParse(updateDeviceLabelSchema, input)
  if (!parsed.success) return { error: parsed.issues[0]?.message ?? 'Données invalides' }

  try {
    const device = await updateDeviceLabel(parsed.output.deviceId, user.id, parsed.output.label)
    return { data: device }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}

// Marquer un appareil comme "de confiance" ou non.
export async function setDeviceTrustedAction(input: SetDeviceTrustedInput) {
  const auth = await authAccess()
  if (!auth.data) return { error: auth.error }
  const { user } = auth.data

  const parsed = v.safeParse(setDeviceTrustedSchema, input)
  if (!parsed.success) return { error: parsed.issues[0]?.message ?? 'Données invalides' }

  try {
    const device = await setDeviceTrusted(parsed.output.deviceId, user.id, parsed.output.isTrusted)
    return { data: device }
  } catch (e) {
    return { error: e instanceof Error ? e.message : ERRORS.SERVER }
  }
}
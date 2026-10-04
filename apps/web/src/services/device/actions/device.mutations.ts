// src/services/device/actions/device.mutations.ts
'use server'
import * as v from 'valibot'
import { authAccess } from '@/services/auth'
import { ERRORS } from '@/config'
import { logAuditAsync } from '@/utils/server/audit'
import {
  revokeSessionSchema,
  revokeDeviceSchema,
  updateDeviceLabelSchema,
  setDeviceTrustedSchema,
  type RevokeSessionInput,
  type RevokeDeviceInput,
  type UpdateDeviceLabelInput,
  type SetDeviceTrustedInput,
} from '../validation'
import { revokeSession, revokeDevice, updateDeviceLabel, setDeviceTrusted } from '../database'

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
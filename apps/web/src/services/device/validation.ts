import * as v from 'valibot'

export const captureLoginDeviceSchema = v.object({
  userId: v.pipe(v.string(), v.uuid('ID invalide')),
  // Généré côté serveur (cookie posé par le middleware) — pas un UUID
  // Postgres, juste un identifiant opaque (cf. Invitation.token).
  deviceId: v.pipe(v.string(), v.minLength(8, 'deviceId invalide'), v.maxLength(200)),
  authSessionId: v.optional(v.string()), // claim session_id du JWT, best-effort
})
export type CaptureLoginDeviceInput = v.InferInput<typeof captureLoginDeviceSchema>
export type CaptureLoginDeviceOutput = v.InferOutput<typeof captureLoginDeviceSchema>

export const endSessionOnLogoutSchema = v.object({
  userId: v.pipe(v.string(), v.uuid('ID invalide')),
  deviceId: v.pipe(v.string(), v.minLength(8, 'deviceId invalide'), v.maxLength(200)),
})
export type EndSessionOnLogoutInput = v.InferInput<typeof endSessionOnLogoutSchema>

export const revokeSessionSchema = v.object({
  sessionId: v.pipe(v.string(), v.uuid('ID invalide')),
})
export type RevokeSessionInput = v.InferInput<typeof revokeSessionSchema>

export const revokeDeviceSchema = v.object({
  deviceId: v.pipe(v.string(), v.uuid('ID invalide')), // id interne UserDevice.id, pas le cookie
})
export type RevokeDeviceInput = v.InferInput<typeof revokeDeviceSchema>

export const updateDeviceLabelSchema = v.object({
  deviceId: v.pipe(v.string(), v.uuid('ID invalide')),
  label: v.nullable(v.pipe(v.string(), v.maxLength(50, 'Nom trop long (50 car. max)'))),
})
export type UpdateDeviceLabelInput = v.InferInput<typeof updateDeviceLabelSchema>

export const setDeviceTrustedSchema = v.object({
  deviceId: v.pipe(v.string(), v.uuid('ID invalide')),
  isTrusted: v.boolean(),
})
export type SetDeviceTrustedInput = v.InferInput<typeof setDeviceTrustedSchema>
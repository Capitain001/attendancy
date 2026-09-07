// ⚠ Fichier généré automatiquement — NE PAS ÉDITER À LA MAIN
// Régénérer : npx tsx scripts/generate/types/types.ts device
// Pour surcharger un type, définissez-le dans ./types.ts (jamais écrasé).

import { upsertDeviceOnLogin, expireSessionOnLogout, revokeSession, revokeDevice, touchSessionActivity, getUserDevices, getUserSessions, getSession } from './database'

export type UpsertDeviceOnLoginDto = Awaited<ReturnType<typeof upsertDeviceOnLogin>>
export type ExpireSessionOnLogoutDto = Awaited<ReturnType<typeof expireSessionOnLogout>>
export type RevokeSessionDto = Awaited<ReturnType<typeof revokeSession>>
export type RevokeDeviceDto = Awaited<ReturnType<typeof revokeDevice>>
export type TouchSessionActivityDto = Awaited<ReturnType<typeof touchSessionActivity>>
export type GetUserDevicesDto = Awaited<ReturnType<typeof getUserDevices>>
export type GetUserSessionsDto = Awaited<ReturnType<typeof getUserSessions>>
export type GetSessionDto = Awaited<ReturnType<typeof getSession>>

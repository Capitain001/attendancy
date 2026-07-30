// src/services/invite/core.ts
// Helpers partagés (non server-action) — token generation + Supabase invite email.
// Utilisés par sendInviteAction et les sous-modules direction/, student/, parent/.
import { createAdminClient } from '@/utils/supabase/server'
import { INVITE_URL } from '@/config/url'

const VALID_EXPIRES_DAYS = [1, 3, 7, 14, 30] as const

export function generateInviteToken(expiresInDays = 7): { token: string; expiresAt: Date } {
  const days = (VALID_EXPIRES_DAYS as readonly number[]).includes(expiresInDays) ? expiresInDays : 7
  return {
    token: crypto.randomUUID(),
    expiresAt: new Date(Date.now() + days * 24 * 60 * 60 * 1000),
  }
}

export async function sendSupabaseInviteEmail(email: string, token: string): Promise<string | null> {
  const admin = await createAdminClient()
  const redirectTo = `${INVITE_URL}?token=${token}`
  const { error } = await admin.auth.admin.inviteUserByEmail(email, { redirectTo })
  return error ? error.message : null
}

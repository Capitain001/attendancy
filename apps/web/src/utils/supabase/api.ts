// Vérification d'un Bearer token JWT Supabase depuis une API route Next.js.
// Utilisé par les routes appelées depuis Tauri (pas de cookies cross-origin).
import { createClient } from '@supabase/supabase-js'
import type { NextRequest } from 'next/server'

export function extractBearerToken(req: NextRequest): string | null {
  const header = req.headers.get('authorization')
  if (!header?.startsWith('Bearer ')) return null
  return header.slice(7)
}

export async function verifyBearerToken(token: string) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } } },
  )
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return null
  return user
}

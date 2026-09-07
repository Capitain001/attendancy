import type { NextRequest, NextResponse } from 'next/server'
 
const DEVICE_ID_COOKIE = 'device_id'
const DEVICE_ID_MAX_AGE = 60 * 60 * 24 * 365 * 2 // 2 ans
 
// Pose le cookie device_id s'il est absent, en MUTANT la response reçue —
// ne jamais retourner/créer une nouvelle NextResponse ici : ça casserait la
// règle "retourner supabaseResponse tel quel" du middleware Supabase (cf.
// commentaires updateSession).
// httpOnly : pas lisible/falsifiable en JS côté client.
// crypto.randomUUID() = Web Crypto global, dispo nativement sur Edge runtime
// (le middleware n'a pas de `export const runtime = 'nodejs'`, donc Edge).
export function ensureDeviceIdCookie(request: NextRequest, response: NextResponse): void {
  if (request.cookies.get(DEVICE_ID_COOKIE)?.value) return
 
  response.cookies.set(DEVICE_ID_COOKIE, crypto.randomUUID(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: DEVICE_ID_MAX_AGE,
    path: '/',
  })
}
 
// Rafraîchissement de session Supabase dans le middleware Edge.
// Appelé depuis middleware.ts (racine) sur chaque requête matchée.
import { getOrGenerateDeviceId, setDeviceIdCookieOnResponse } from '@/lib/device'
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  // Appel AVANT NextResponse.next({ request }) pour que le header cookie soit
  // mis à jour avec le device_id avant d'être transmis aux Server Actions.
  // Note : request.cookies.set ne suffit pas — on doit passer les headers
  // modifiés à NextResponse.next pour qu'ils soient visibles dans cookies().
  const { deviceId, isNew } = getOrGenerateDeviceId(request)

  const requestHeaders = new Headers(request.headers)
  if (isNew) {
    const currentCookies = requestHeaders.get('cookie') || ''
    requestHeaders.set('cookie', currentCookies ? `${currentCookies}; device_id=${deviceId}` : `device_id=${deviceId}`)
  }

  let supabaseResponse = NextResponse.next({
    request: { headers: requestHeaders },
  })

  // Ne jamais mettre ce client dans une variable globale : un client neuf par
  // requête (compatible Fluid compute / Edge).
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  if (isNew) {
    setDeviceIdCookieOnResponse(supabaseResponse, deviceId)
  }

  // IMPORTANT : retourner supabaseResponse tel quel. Si une nouvelle réponse
  // est créée, copier `request` ET les cookies de supabaseResponse — sinon la
  // session navigateur/serveur se désynchronise et se termine prématurément.
  return supabaseResponse
}
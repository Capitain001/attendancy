// src/utils/supabase/middleware.ts
// Rafraîchissement de session Supabase dans le middleware Edge.
// Appelé depuis middleware.ts (racine) sur chaque requête matchée.
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
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
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT : ne rien exécuter entre createServerClient et getClaims() —
  // et ne pas retirer getClaims() : sans lui, les sessions SSR peuvent être
  // déconnectées aléatoirement.
  const { data } = await supabase.auth.getClaims()
  const user = data?.claims

  if (
    !user &&
    !request.nextUrl.pathname.startsWith('/login') &&
    !request.nextUrl.pathname.startsWith('/auth')
  ) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // IMPORTANT : retourner supabaseResponse tel quel. Si une nouvelle réponse
  // est créée, copier `request` ET les cookies de supabaseResponse — sinon la
  // session navigateur/serveur se désynchronise et se termine prématurément.
  return supabaseResponse
}

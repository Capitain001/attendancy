// src/utils/supabase/server.ts
// Clients Supabase côté serveur (Server Components / Server Actions).
// L'accès aux cookies rend tout appelant dynamique au sens Next.js — c'est ce
// qui permet à getUserInfo() d'opter automatiquement hors du prerendering PPR.
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

async function cookieStore() {
  return cookies()
}

// Client ANON — sessions utilisateur cookie-based (lecture/écriture session)
export async function createClient() {
  const store = await cookieStore()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    //process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!, // fix volontaire , USAGE DE AMON KEY apres reconfiguration des RLS prevus 02-09-2026
    {
      cookies: {
        getAll() {
          return store.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              store.set(name, value, options)
            )
          } catch { }
        },
      },
    }
  )

}

// Client Service Role — opérations admin UNIQUEMENT, jamais exposé au client :
// auth.admin.updateUserById, auth.admin.generateLink, auth.admin.deleteUser
export async function createAdminClient() {
  const store = await cookieStore()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll() {
          return store.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              store.set(name, value, options)
            )
          } catch { }
        },
      },
    }
  )
}

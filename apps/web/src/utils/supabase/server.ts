// src/utils/supabase/server.ts
// Clients Supabase côté serveur (Server Components / Server Actions).
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database'

async function cookieStore() {
  return cookies()
}

// Client ANON — sessions utilisateur cookie-based (lecture/écriture session)
export async function createClient() {
  const store = await cookieStore()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    // process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!, // fix volontaire, USAGE DE ANON KEY après reconfiguration des RLS prévus 02-09-2026
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

  return createServerClient<Database>(
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
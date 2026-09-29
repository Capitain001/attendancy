// src/utils/supabase/bearer.ts
import { createClient as createTokenClient } from "@supabase/supabase-js"

/**
 * Client Supabase stateless pour la vérification des tokens Bearer (Tauri / API).
 * Sans persistance de session ni rafraîchissement par cookies.
 */
export const createBearerClient = () =>
  createTokenClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  )
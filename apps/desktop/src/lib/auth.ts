// apps/desktop/src/lib/auth.ts
import { supabase } from './supabase'

export async function getToken() {
  const { data } = await supabase.auth.getSession()
  return data.session?.access_token ?? null
}
import { useState, useEffect } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

export interface AuthState {
  session: Session | null
  user: User | null
  loading: boolean
  error: string | null
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    session: null,
    user: null,
    loading: true,
    error: null,
  })

  useEffect(() => {
    // Restaure la session persistée
    supabase.auth.getSession().then(({ data: { session } }) => {
      setState((s) => ({ ...s, session, user: session?.user ?? null, loading: false }))
    })

    // Écoute les changements (login / logout / refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setState((s) => ({ ...s, session, user: session?.user ?? null, loading: false }))
    })

    return () => subscription.unsubscribe()
  }, [])

  async function login(email: string, password: string): Promise<string | null> {
    setState((s) => ({ ...s, loading: true, error: null }))
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setState((s) => ({ ...s, loading: false, error: error?.message ?? null }))
    return error?.message ?? null
  }

  async function logout() {
    await supabase.auth.signOut()
  }

  return { ...state, login, logout }
}

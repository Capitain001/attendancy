// apps/desktop/src/hooks/useAuth.ts
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { getSessionState, type SessionState } from '../lib/auth'

export function useAuth() {
  const [state, setState] = useState<SessionState | null>(null) // null = chargement

  useEffect(() => {
    getSessionState().then(setState)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      getSessionState().then(setState)
    })
    return () => subscription.unsubscribe()
  }, [])

  return state
}
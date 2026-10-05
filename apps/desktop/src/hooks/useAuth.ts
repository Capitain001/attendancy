// apps/desktop/src/hooks/useAuth.ts
import { useEffect, useState } from 'react'
import { claimLocalData } from '@desktop/lib/cache/clear'
import { supabase } from '../lib/supabase'
import {
  getSessionState,
  type SessionState,
} from "../lib/auth/session";

export function useAuth() {
  const [state, setState] = useState<SessionState | null>(null) // null = chargement

  useEffect(() => {
    getSessionState().then(setState)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      getSessionState().then(setState)
    })
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (state?.status === 'signed-in') void claimLocalData(state.session.user.id)
  }, [state])

  return state
}
'use server'
// src/services/auth/members/actions.ts

import { redirect } from 'next/navigation'
import { safeParse } from 'valibot'
import { createClient } from '@/utils/supabase/server'
import { PROFILE_URL } from '@/config/url'
import { signupMemberSchema } from './validation'
import { completeSignup } from './complete-signup'
import type { AuthActionResult } from '../types'


export async function signupMemberAction(
  _prevState: AuthActionResult,
  formData: FormData
): Promise<AuthActionResult> {
  const result = safeParse(signupMemberSchema, {
    password: formData.get('password'),
    confirmPassword: formData.get('confirmPassword'),
  })

  if (!result.success) {
    return { error: result.issues[0]?.message ?? 'Validation échouée' }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.updateUser({
    password: result.output.password,
  })

  if (error) return { error: error.message }

  // Création des enregistrements DB en arrière-plan — ne bloque pas la réponse.
  // En cas d'échec, logAudit + monitoring doivent alerter (TODO).
  setImmediate(async () => {
    const result = await completeSignup()
    if ('error' in result) {
      console.error('[signupMemberAction] completeSignup failed:', result.error)
    }
  })

  redirect(PROFILE_URL)
}
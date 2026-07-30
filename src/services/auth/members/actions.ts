'use server'
// src/services/auth/members/actions.ts
// Action de finalisation du signup pour les membres invités.
// L'utilisateur arrive via un lien d'invitation (token Supabase), définit son
// mot de passe ici. completeSignup() crée les enregistrements DB en background.
import { safeParse } from 'valibot'
import { createClient } from '@/utils/supabase/server'
import { memberSignupSchema } from './validation'
import { completeSignup } from './complete-signup'

export async function submitSignupFormAction(data: {
  password: string
  confirmPassword: string
}) {
  const result = safeParse(memberSignupSchema, data)
  if (!result.success) return { error: result.issues[0]?.message ?? 'Validation échouée' }

  if (result.output.password !== result.output.confirmPassword) {
    return { error: 'Les mots de passe ne correspondent pas' }
  }

  const supabase = await createClient()
  const { data: userData, error } = await supabase.auth.updateUser({
    password: result.output.password,
  })

  if (error) return { error: error.message }

  // Création des enregistrements DB en arrière-plan — ne bloque pas la réponse.
  // En cas d'échec, logAudit + monitoring doivent alerter (TODO).
  setImmediate(async () => {
    const result = await completeSignup()
    if ('error' in result) {
      console.error('[submitSignupFormAction] completeSignup failed:', result.error)
    }
  })

  return { data: { userId: userData.user.id } }
}

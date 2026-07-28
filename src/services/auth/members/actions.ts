'use server'
// src/services/auth/members/actions.ts
// Action de finalisation du signup pour les membres invités.
// L'utilisateur arrive via un lien d'invitation (token Supabase), définit son
// mot de passe ici. completeSignup() crée les enregistrements DB en background.
import { parse, ValiError } from 'valibot'
import { createClient } from '@/utils/supabase/server'
import { memberSignupSchema } from './validation'
import { completeSignup } from './complete-signup'

export async function submitSignupFormAction(data: {
  password: string
  confirmPassword: string
}) {
  let parsed
  try {
    parsed = parse(memberSignupSchema, data)
  } catch (e) {
    const msg = e instanceof ValiError ? e.issues[0]?.message ?? 'Validation échouée' : 'Entrée invalide'
    return { error: msg }
  }

  if (parsed.password !== parsed.confirmPassword) {
    return { error: 'Les mots de passe ne correspondent pas' }
  }

  const supabase = await createClient()
  const { data: userData, error } = await supabase.auth.updateUser({
    password: parsed.password,
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

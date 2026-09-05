'use server'
// src/services/auth/members/actions.ts

import { redirect } from 'next/navigation'
import { safeParse } from 'valibot'
import { createClient } from '@/utils/supabase/server'
import { PROFILE_URL } from '@/config/url'
import { signupMemberSchema } from './validation'
import { completeSignup } from './complete-signup'
import type { AuthActionResult } from '../types'

import { redirectUser } from '@/config/redirects'
import { UserStatus } from '@/types/user'
import { getUserInfo } from '@/modules/user'



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
  
  //setup profile url
  redirect(PROFILE_URL)
}    




/**
 * Utilisateur déjà inscrit (status !== NEW) qui rejoint une organisation 
 * suite à une invitation. Pas de mot de passe à poser : on réutilise
 * completeSignup() directement, puis on redirige.
 *
 * Ne PAS appeler pour un NEW user — l'acceptation réelle passe par
 * signupMemberAction (via SignupForm), qui déclenche completeSignup()
 * après création du mot de passe.
 */
export async function joinOrganizationAction(): Promise<AuthActionResult> {
  const user = await getUserInfo({ cache: false })
  if (!user) redirect('/login')

  if (user.status === UserStatus.NEW) {
    return { error: 'Complétez votre inscription pour rejoindre cette organisation.' }
  }

  const result = await completeSignup()
  if ('error' in result) return { error: result.error }

  const updatedUser = await getUserInfo({ cache: false })
  redirect(redirectUser(updatedUser ?? user))
}

export async function declineInvitationAction(): Promise<AuthActionResult> {
  const user = await getUserInfo({ cache: false })
  if (!user) redirect('/login')

  if (!user.invitationToken) {
    return { error: 'Aucune invitation en attente.' }
  }

  // TODO: marquer l'invitation comme refusée en DB (ex: invitation.declinedAt)
  // try {
  //   await declineInvitation(user.invitationToken)
  // } catch (err) {
  //   return { error: err instanceof Error ? err.message : 'Erreur inconnue' }
  // }

  return null
}

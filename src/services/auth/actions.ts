// src/services/auth/actions.ts
// Server actions d'authentification.
//
// Exception structurelle assumée : auth est un service d'infrastructure sans
// modèle métier propre — ses actions vivent dans ce fichier unique plutôt que
// dans un dossier actions/ (réservé aux services à modèle : queries/mutations).
//
// Convention de retour : { data } / { error: string } — comme partout.
'use server'

import { safeParse } from 'valibot'
import { redirect } from 'next/navigation'
import { signupSchema, loginSchema } from './validation'
import type { SignupInput, LoginInput } from './validation'
import { signUpPrincipal, signUpResponsable, loginWithPassword, logout } from './supabase/auth'
import { createUserRecord, createOrgResponsableDB } from './database/user.mutations'
import { getUserInfo } from '@/services/user/userInfo'
import { redirectUser } from '@/config/redirects'

// SignupInput = InferInput<signupSchema> — typage UI (avant transformations)

export async function signupPrincipalAction(input: SignupInput) {
  const result = safeParse(signupSchema, input)

  if (!result.success) {
    return { error: result.issues[0]?.message ?? 'Validation échouée' }
  }

  const { email, password } = result.output

  const { data, error } = await signUpPrincipal(email, password)

  if (error || !data.user) {
    return { error: error?.message ?? 'Inscription échouée' }
  }

  await createUserRecord({ id: data.user.id, email })

  return { data: { userId: data.user.id } }
}

// Signature compatible useActionState : (prevState, formData).
export async function loginAction(_prevState: unknown, formData: FormData) {
  const result = safeParse(loginSchema, {
    email: formData.get('email'),
    password: formData.get('password'),
  })
  if (!result.success) return { error: result.issues[0]?.message ?? 'Validation échouée' }

  const { error } = await loginWithPassword(result.output.email, result.output.password)

  if (error) {
    return { error: error.message }
  }

  // cache: false — lecture fraîche obligatoire juste après login
  const user = await getUserInfo({ cache: false })

  if (!user) {
    return { error: 'Session introuvable après connexion' }
  }

  // Support ?next= — préserve la destination d'origine (deep link protégé)
  const next = formData.get('next') as string | null
  const redirectPath = next && next.startsWith('/') ? next : redirectUser(user)

  return { data: { redirectPath } }
}

export async function logoutAction() {
  await logout()
  redirect('/login')
}

// Responsable nommé par la plateforme (admin global, sans org au signup).
// La ligne User doit exister avant /auth/org-setup (FK userId → User.id).
export async function createOrgResponsableAction(input: SignupInput) {
  const result = safeParse(signupSchema, input)
  if (!result.success) return { error: result.issues[0]?.message ?? 'Validation échouée' }

  const { data, error } = await signUpResponsable(result.output.email, result.output.password)

  if (error || !data.user) {
    return { error: error?.message ?? 'Inscription échouée' }
  }

  await createOrgResponsableDB({
    id: data.user.id,
    email: result.output.email,
    firstName: '',
    lastName: '',
  })

  return { data: { userId: data.user.id } }
}

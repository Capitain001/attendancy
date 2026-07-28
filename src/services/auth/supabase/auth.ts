// src/services/auth/supabase/auth.ts
// Opérations Supabase Auth — seule couche qui parle à supabase.auth.
// Les actions (actions.ts) orchestrent par-dessus.
import { createClient, createAdminClient } from '@/utils/supabase/server'
import { CALL_BACK, SITE_URL } from '@/config/url'
import { ERRORS } from '@/config'
import { getUserInfo } from '@/services/user/userInfo'
import type { OrgContext } from '@/services/user/types'

// ── Signup ────────────────────────────────────────────────────────────────────

// Compte fondateur (direction qui crée son organisation).
// ⚠ À CONFIGURER PAR PROJET — aligner role/function sur les rôles du projet.
export async function signUpPrincipal(email: string, password: string) {
  const supabase = await createClient()
  return supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: CALL_BACK,
      data: {
        role: 'DIRECTION',
        function: 'PRINCIPAL',
        status: 'NEW',
      },
    },
  })
}

// Responsable nommé par la plateforme (compte admin global).
// ⚠ À CONFIGURER PAR PROJET — rôle/fonction selon la nomenclature du projet.
export async function signUpResponsable(email: string, password: string) {
  const supabase = await createClient()
  return supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: CALL_BACK,
      data: {
        role: 'ADMIN',
        function: 'SUPER_ADMIN',
        status: 'NEW',
      },
    },
  })
}

// ── Auth opérations courantes ─────────────────────────────────────────────────

export async function loginWithPassword(email: string, password: string) {
  const supabase = await createClient()
  return supabase.auth.signInWithPassword({ email, password })
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
}

export async function resendSignupEmail(email: string) {
  const supabase = await createClient()
  const { error } = await supabase.auth.resend({
    type: 'signup',
    email,
    options: { emailRedirectTo: CALL_BACK },
  })
  return { success: !error, error: error?.message ?? null }
}

export async function resetPassword(email: string) {
  const supabase = await createClient()
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${SITE_URL}/auth/update-password`,
  })
  return { success: !error, error: error?.message ?? null }
}

export async function updateAuthUser(password: string, email?: string) {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.updateUser({
    password,
    ...(email ? { email } : {}),
  })
  if (error) return { error: error.message }
  return { data: { userId: data.user.id } }
}

// ── OAuth ─────────────────────────────────────────────────────────────────────

export async function signInWithGoogle() {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: CALL_BACK },
  })
  if (error) return { error: error.message }
  return { data: { url: data.url } }
}

// ── Admin (service-role) ──────────────────────────────────────────────────────

export async function deleteAuthUser(userId: string) {
  const supabase = await createAdminClient()
  const { error } = await supabase.auth.admin.deleteUser(userId)
  if (error) return { error: error.message }
  return { data: { userId } }
}

export async function findAuthUserByEmail(email: string) {
  const supabase = await createAdminClient()
  const { data, error } = await supabase.auth.admin.listUsers()
  if (error) return { error: error.message }
  const user = data.users.find((u) => u.email === email) ?? null
  return { data: { user } }
}

// ── OrgContext (frontière RULE-USR-001) ───────────────────────────────────────

// Extrait l'OrgContext depuis la session — throw si incomplet.
// orgId ne peut sortir QUE d'ici côté serveur, jamais du body/query/headers.
export async function getOrgContext(): Promise<OrgContext> {
  const user = await getUserInfo()

  if (!user?.id) throw new Error(ERRORS.AUTH.UNAUTHORIZED)
  if (!user.organization?.id) throw new Error(ERRORS.ORG.NOT_FOUND)
  if (!user.role) throw new Error('Rôle manquant dans la session')
  if (!user.function) throw new Error('Fonction manquante dans la session')

  return {
    userId: user.id,
    orgId: user.organization.id,
    role: user.role,
    function: user.function,
  }
}

// src/services/auth/supabase.ts
// Opérations Supabase Auth — seule couche qui parle à supabase.auth.
// Les actions (actions.ts) orchestrent par-dessus.

"use server";

import { createClient, createAdminClient } from '@/utils/supabase/server';
import { CALL_BACK, SITE_URL } from '@/config/url';
// import { UserStatus } from '@/types';
import { Functions, UserStatus, UserInfo } from '@/types/user';
import { Role } from '@/generated/prisma/browser';


interface SignUpParams {
  email: string;
  password: string;
  info?: Partial<Pick<UserInfo, "name" | "phone" | "avatar_url">>;
}

// ── Signup ────────────────────────────────────────────────────────────────────

/**
 * Responsable nommé par la plateforme (compte admin global).
 * ⚠ À CONFIGURER PAR PROJET — rôle/fonction selon la nomenclature du projet.
 */
export async function signUpResponsable(
  email: string,
  password: string,
  info?: Partial<Pick<UserInfo, "name" | "phone" | "avatar_url">>
) {
  const supabase = await createClient();
  return supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: CALL_BACK,
      data: {
        ...(info || {}),
        role: Role.ADMIN,
        function: Functions.SUPER_ADMIN,
        status: UserStatus.NEW,
      },
    },
  });
}

/**
 * Compte fondateur (direction qui crée son organisation).
 * ⚠ À CONFIGURER PAR PROJET — aligner role/function sur les rôles du projet.
 */
export async function signUpPrincipal(
  email: string,
  password: string,
  info?: Partial<Pick<UserInfo, "name" | "phone" | "avatar_url">>
) {
  const supabase = await createClient();
  return supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: CALL_BACK,
      data: {
        ...(info || {}),
        role: Role.DIRECTION,
        function: Functions.PRINCIPAL,
        status: UserStatus.NEW,
      },
    },
  });
}

// ── Auth opérations courantes ─────────────────────────────────────────────────

/**
 * Connexion avec email et mot de passe
 */
export async function loginWithPassword(email: string, password: string) {
  const supabase = await createClient();
  return supabase.auth.signInWithPassword({ email, password });
}

/**
 * Renvoie l'email de confirmation d'inscription (lien expiré / non reçu).
 * A3 — utilisé par /auth/link-expired.
 */
export async function resendSignupEmail(email: string) {
  const supabase = await createClient();
  const { error } = await supabase.auth.resend({
    type: 'signup',
    email,
    options: { emailRedirectTo: CALL_BACK },
  });
  return { success: !error, error: error?.message ?? null };
}

/**
 * Réinitialisation du mot de passe
 */
export async function resetPassword(email: string) {
  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${SITE_URL}/auth/update-password`,
  });
  return { success: !error, error: error?.message ?? null };
}

/**
 * Mise à jour du mot de passe et/ou de l'email de l'utilisateur
 */
export async function updateAuthUser(password: string, email?: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.updateUser({
    password,
    ...(email ? { email } : {}),
  });
  if (error) return { error: error.message };
  return { data: { userId: data.user.id } };
}

// ── OAuth ─────────────────────────────────────────────────────────────────────


type OAuthProvider = 'google' | 'github';

async function signInWithOAuthProvider(provider: OAuthProvider, next?: string) {
  const supabase = await createClient();
  const redirectTo = next
    ? `${CALL_BACK}?next=${encodeURIComponent(next)}`
    : CALL_BACK;

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: { redirectTo },
  });

  if (error) return { error: error.message };
  return { url: data.url };
}

/**
 * Connexion avec Google OAuth
 */
export async function signInWithGoogle(next?: string) {
  return signInWithOAuthProvider('google', next);
}

/**
 * Connexion avec GitHub OAuth
 */
export async function signInWithGitHub(next?: string) {
  return signInWithOAuthProvider('github', next);
}




// ── Admin (service-role) ──────────────────────────────────────────────────────

/**
 * Supprime un utilisateur Auth par son ID
 */
export async function deleteAuthUser(userId: string) {
  const supabase = await createAdminClient();
  const { error } = await supabase.auth.admin.deleteUser(userId);
  if (error) return { error: error.message };
  return { data: { userId } };
}

/**
 * Trouve un utilisateur Auth par son email
 */
export async function findAuthUserByEmail(email: string) {
  const supabase = await createAdminClient();
  const { data, error } = await supabase.auth.admin.listUsers();
  if (error) return { error: error.message };
  const user = data.users.find((u) => u.email === email) ?? null;
  return { data: { user } };
}

// ── Déconnexion ───────────────────────────────────────────────────────────────

/**
 * Déconnexion simple
 */
export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
}


/**
 * Inscription générique avec métadonnées personnalisables
 * Version simplifiée pour la compatibilité
 */
export async function signUp(
  email: string,
  password: string,
  metadata?: {
    name?: string;
    phone?: string;
    avatar_url?: string;
    role?: string;
    function?: string;
    status?: string;
  }
) {
  const supabase = await createClient();
  return supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: CALL_BACK,
      data: {
        ...(metadata || {}),
        status: metadata?.status || UserStatus.NEW,
      },
    },
  });
}

/**
 * Mise à jour du profil utilisateur (Auth uniquement)
 */
export async function updateProfile(
  userId: string,
  data: {
    name?: string;
    phone?: string;
    avatar_url?: string;
  }
) {
  const supabase = await createClient();
  const { error: authError } = await supabase.auth.updateUser({
    //ecris dans user.user_metadata conforme a la lecture du cache
    data: {
      name: data.name,
      phone: data.phone,
      avatar_url: data.avatar_url,
    },
  });
  if (authError) return { error: authError.message };
  return { data: { userId } };
}



// ── TODO / En attente ────────────────────────────────────────────────────────

/**
 * @TODO Fonction à implémenter pour l'authentification WhatsApp
 */
export async function signinWhatsapp(){

  /* is juste TODO FUNCTION */
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithOtp({
    phone: '+13334445555',
    options: {
      channel:'whatsapp',
    }
  })

  // to invite user
 await supabase.auth.admin.generateLink({
    type: 'magiclink',
    email: 'email@example.com',
    options:{
      redirectTo: CALL_BACK,
    }
  } 
)

}
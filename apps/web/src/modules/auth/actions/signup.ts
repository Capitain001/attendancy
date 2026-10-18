// src/modules/auth/actions/signup.ts
"use server";

import { redirect } from "next/navigation";
import { safeParse } from "valibot";
import { ResendSignupEmailInput, resendSignupEmailSchema, signupPersonalSchema, signupSchema } from "../validation";
import { signUpPrincipal, resendSignupEmail, signUpPersonal } from "../supabase";
import { createUserRecord } from "../database";
import { PersonalSignupRole } from "../constants";

export type SignupState = { error: string } | null;

export async function signupPrincipalAction(
  _prevState: SignupState,
  formData: FormData
) {
  const result = safeParse(signupSchema, {
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!result.success) {
    return { error: result.issues[0]?.message ?? "Validation échouée" };
  }

  const { email, password } = result.output;
  //creation du compte auth supabase
  const { data, error } = await signUpPrincipal(email, password);

  if (error || !data.user) {
    return { error: error?.message ?? "Inscription échouée" };
  }

  try {
    //enregistrement de l user dans la table profile avec les donnees minimaliste , il les completera plus tard dans PROFILE_URL
    await createUserRecord({ id: data.user.id, email });
  } catch (error) {
    return { 
      error: error instanceof Error ? error.message : "Erreur lors de la création de l'utilisateur" 
    };
  }

  redirect(`/auth/check-email?email=${encodeURIComponent(email)}`);
}

// 1. Logique pure, sans redirect. Retourne { data } ou { error }
export async function signupPersonal(input: unknown) {
  const parsed = safeParse(signupPersonalSchema, input);
  if (!parsed.success) {
    return { error: parsed.issues[0]?.message ?? "Validation échouée" };
  }

  const { email, password } = parsed.output;
  const { data, error } = await signUpPersonal(email, password);
  if (error || !data.user) {
    return { error: error?.message ?? "Inscription échouée" };
  }

  try {
    await createUserRecord({ id: data.user.id, email });
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Erreur lors de la création de l'utilisateur",
    };
  }

  return { data: { email } };
}



//signupPersonalAction inscription a sans org
export async function signupPersonalAction(_prev: SignupState, formData: FormData) {
  const result = await signupPersonal({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!result.data) {
    return { error: result.error ?? "Inscription échouée" };
  }

  redirect(`/auth/check-email?email=${encodeURIComponent(result.data.email)}`);
}

type ResendState = { success: boolean; error?: string } | null
// Version "pure" : appelable depuis un hook, un onClick, un composant client…
export async function resendSignupEmailAction(input: ResendSignupEmailInput) {
  const parsed = safeParse(resendSignupEmailSchema, input)
  if (!parsed.success) {
    return { success: false, error: parsed.issues[0]?.message ?? 'Données invalides' }
  }

  const result = await resendSignupEmail(parsed.output.email)
  return result.success
    ? { success: true }
    : { success: false, error: result.error ?? "Erreur lors de l'envoi" }
}


export async function resendSignupEmailFormAction(
  _prevState: ResendState,
  formData: FormData,
) {
  return resendSignupEmailAction({ email: String(formData.get('email') ?? '') })
}
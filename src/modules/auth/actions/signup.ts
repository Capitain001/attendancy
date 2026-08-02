// src/modules/auth/actions/signup.ts
"use server";

import { redirect } from "next/navigation";
import { safeParse } from "valibot";
import { signupSchema } from "../validation";
import { signUpPrincipal } from "../supabase";
import { createUserRecord } from "../database";

type SignupState = { error: string } | null;

export async function signupPrincipalAction(
  _prevState: SignupState,
  formData: FormData
): Promise<SignupState> {
  const result = safeParse(signupSchema, {
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!result.success) {
    return { error: result.issues[0]?.message ?? "Validation échouée" };
  }

  const { email, password } = result.output;
  const { data, error } = await signUpPrincipal(email, password);

  if (error || !data.user) {
    return { error: error?.message ?? "Inscription échouée" };
  }

  await createUserRecord({ id: data.user.id, email });

  redirect("/auth/check-email"); // navigation serveur directe, pas de round-trip client
}



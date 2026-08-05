"use server";

import { resetPassword } from "../supabase";

type ResetPasswordState = { success: true } | { error: string } | null;

export async function forgotPassword(
  _prevState: ResetPasswordState,
  formData: FormData
): Promise<ResetPasswordState> {
  const email = formData.get("email") as string;

  if (!email) return { error: "Email requis" };

  const { success, error } = await resetPassword(email);

  if (!success) return { error: error ?? "Erreur lors de l'envoi du lien" };

  return { success: true };
}

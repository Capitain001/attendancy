"use server";
import { redirect } from "next/navigation";
import { redirectUser } from "@/config/redirects";
import { getUserInfo, setUserInfo } from "@/modules/user";
import { loginWithPassword } from "../supabase";

type LoginState = { error: string } | null;

export async function login(
  _prevState: LoginState,
  formData: FormData
) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const next = formData.get("next") as string | null;

  if (!email || !password) {
    return { error: "Email et mot de passe requis" };
  }

  const { data: authData, error: signInError } = await loginWithPassword(
    email,
    password
  );

  if (signInError) {
    console.error("signin error cause:", signInError.message);
    // return { error: signInError.message  };
    return { error: "Email ou mot de passe incorrect" };
  }

  if (!authData.user) {
    return { error: "Erreur lors de la connexion" };
  }

  const user = await getUserInfo({ cache: false });

  if (!user) {
    return { error: "Erreur lors de la récupération des informations utilisateur" };
  }

  await setUserInfo({ isConnected: true });

  const redirectPath =
    next && next.startsWith("/") && !next.startsWith("//")
      ? next
      : redirectUser(user);

  redirect(redirectPath); // navigation serveur directe, pas de round-trip client
}


export async function loginAction(formData: FormData): Promise<void> {
  const result = await login(null, formData);
  if (result?.error) {
    redirect(`/auth/signin?error=${encodeURIComponent(result.error)}`);
  }
  // pas d'erreur → login() a déjà appelé redirect() en interne, donc on n'arrive jamais ici
}

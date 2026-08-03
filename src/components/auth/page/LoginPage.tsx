import { Metadata } from "next";

import { redirect } from "next/navigation";
import AuthForm from "@/components/auth/form/AuthForm";
import { getUserInfo } from "@/services/user";
import { getRedirectPath } from "@/config";

export const metadata: Metadata = {
  title: "Connexion",
  description: "Connectez-vous à votre espace",
};

export  async function LoginPage() {

  const user = await getUserInfo();

  if (user) {
    //@ts-ignore
    const redirectPath = getRedirectPath(user.role, user.organization?.slug);
    redirect(redirectPath);
  }

  return <AuthForm />;
}

// src/services/auth/responsable/signup.ts
'use server';

import { signUpResponsable } from "../auth";
import { createOrgResponsableDB } from "../database";

export interface CreateOrgResponsableParams {
  email: string;
  password: string;
}

export async function createOrgResponsable({
  email,
  password,
}: CreateOrgResponsableParams) {
  // 1️⃣ Création côté Supabase (auth)
  const { data, error } = await signUpResponsable({
    email,
    password,
  });

  if (error) {
    throw new Error(error.message || "Erreur lors de l'inscription");
  }

  if (!data) {
    throw new Error("Erreur lors de l'inscription");
  }

  // Profil DB créé dès le signup : la ligne User doit exister AVANT /auth/org-setup
  // (createUserOrganization a une FK userId → User.id). Nom complété plus tard (ProfileStepper).
  if (data.user?.id) {
    await createOrgResponsableDB({
      id: data.user.id,
      firstName: "",
      lastName: "",
      email,
    });
  }

  return {
    success: true,
    user: data.user,
    responsable: {
      id: data.user?.id,
      email: data.user?.email,
    },
  };
}

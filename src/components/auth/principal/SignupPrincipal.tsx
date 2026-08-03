"use client";

import { createPrincipal } from "@/services/auth/principal/signup";
import { isError } from "@/utils/server/utils";
import { useActionState, useEffect, useState } from "react";

import { SignupPrincipalView } from "./SignupPrincipalUi";

// État initial adapté au pattern UI du composant
const initialState = {
  success: false,
  message: null as string | null,
  user: null as { id: string; email?: string } | null,
};

export function SignupPrincipal() {
  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [state, formAction, isPending] = useActionState(
    async (prevState: typeof initialState, formData: FormData) => {
      const result = await createPrincipal({
        email: formData.get("email") as string,
        password: formData.get("password") as string,
      });

      // Si le retour contient une erreur gérée par tryCatch
      if (isError(result)) {
        return {
          success: false,
          message: result.error,
          user: null,
        };
      }

      // Tout s'est bien passé
      return {
        success: true,
        message: `Compte direction créé pour : ${result.data.principal.email}`,
        user: result.data.principal,
      };
    },
    initialState,
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // Réinitialiser le formulaire après succès
  useEffect(() => {
    if (state.success) {
      setForm({ email: "", password: "" });
    }
  }, [state.success]);

  return (
    <SignupPrincipalView
      form={form}
      message={state.message}
      success={state.success}
      isPending={isPending}
      formAction={formAction}
      onChange={handleChange}
    />
  );
}
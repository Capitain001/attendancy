"use client";

import { createOrgResponsable } from "@/services/auth/responsable/signup";
import { useActionState, useEffect, useState } from "react";
import { LoadButton } from "../ui/LoadButton";

// État initial
const initialState = {
  success: false,
  message: null as string | null,
  user: null as { id: string; email: string } | null,
};

export  function SignupMainOrg() {
  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [state, formAction, isPending] = useActionState(
    //@ts-ignore
    async (prevState: typeof initialState, formData: FormData) => {
      try {
        const result = await createOrgResponsable({
          email: formData.get("email") as string,
          password: formData.get("password") as string,
        });
        
        return {
          success: true,
          message: `Compte créé avec succès pour : ${result.responsable.email}`,
          user: result.responsable,
        };
      } catch (error) {
        return {
          success: false,
          message: error instanceof Error ? error.message : "Erreur lors de la création du compte",
          user: null,
        };
      }
    },
    initialState
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // Réinitialiser le formulaire après succès
  useEffect(() => {
    if (state.success) {
      setForm({ email: "", password: "" });
    }
  }, [state.success]);

  return (
    <div className="max-w-md mx-auto p-6  rounded shadow">
      <h2 className="text-2xl font-bold mb-4">Inscription Responsable</h2>
      {state.message && (
        <p className={`mb-4 text-center ${state.success ? "text-green-500" : "text-red-500"}`}>
          {state.message}
        </p>
      )}
      <form action={formAction} className="space-y-4">
        <input
          type="email"
          name="email"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
          required
          className="w-full p-2 border rounded"
        />
        <input
          type="password"
          name="password"
          placeholder="Mot de passe"
          value={form.password}
          onChange={handleChange}
          required
          className="w-full p-2 border rounded"
        />


        <LoadButton text="Créer le compte " loading={isPending} />
        <p className="mt-6 text-center text-sm text-gray-600">
    Déjà inscrit ?{" "}
    <a href="/login" className="text-blue-600 hover:underline">
      Connectez-vous
    </a>
  </p>
      </form>
    </div>
  );
}
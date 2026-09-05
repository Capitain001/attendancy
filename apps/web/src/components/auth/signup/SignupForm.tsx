// src/components/auth/operations/SignupForm.tsx
"use client";

import { useActionState } from "react";
import * as v from "valibot";
import { FormButton } from "../ui/FormButton";



import { useState } from "react";

import { signupMemberAction } from "@/modules/auth/members/actions";
import { signupMemberSchema } from "@/modules/auth/members/validation";
import type { AuthActionResult } from "@/modules/auth/types";

export default function SignupForm() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [state, formAction, isPending] = useActionState<AuthActionResult, FormData>(
    signupMemberAction,
    null
  );

  // Validation live — feedback visuel uniquement, la validation réelle reste côté serveur
  const result = v.safeParse(signupMemberSchema, { password, confirmPassword });

  const isPasswordValid = !result.issues?.some((i) =>
    i.path?.some((p) => p.key === "password")
  );

  const isConfirmPasswordValid =
    result.success || !result.issues?.some((i) => !i.path?.length);

  return (
    <div className="mx-auto w-full max-w-md">
      <div className="rounded-lg border-2 bg-card p-8 shadow-lg">
        <form action={formAction} className="space-y-6">
          <div>
            <label htmlFor="password" className="mb-2 block text-sm font-medium">
              Mot de passe
            </label>
            <div className="relative">
              <input
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-md border px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="••••••••"
              />
              {isPasswordValid && password.length > 0 && (
                <div className="absolute right-2 top-1/2 -translate-y-1/2">
                  {/* <SuccessIcon size={20} status="success" fill="#22c55e" /> */}
                </div>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="confirmPassword" className="mb-2 block text-sm font-medium">
              Confirmer le mot de passe
            </label>
            <div className="relative">
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full rounded-md border px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="••••••••"
              />
              {isConfirmPasswordValid && confirmPassword.length > 0 && (
                <div className="absolute right-2 top-1/2 -translate-y-1/2">
                  {/* <SuccessIcon size={20} status="success" fill="#22c55e" /> */}
                </div>
              )}
            </div>
          </div>

          {state?.error && (
            <p role="alert" className="text-sm text-destructive">
              {state.error}
            </p>
          )}

          <FormButton
            type="submit"
            loading={isPending}
            text="Créer le compte"
            className="w-full"
          />
        </form>

        <p className="mt-4 text-center text-sm text-gray-500">
          En créant un compte, vous acceptez nos conditions d'utilisation et
          notre politique de confidentialité.
        </p>
      </div>
    </div>
  );
}

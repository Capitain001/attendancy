"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { loginAction } from "@/services/auth";
import { useActionState } from "react";
import type { LoginResult } from "@/services/auth";

export const loginSchema = z.object({
  email: z.string().email("Email invalide"),
  password: z.string().min(1, "Le mot de passe est requis"),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

export function useLoginForm() {
  const router = useRouter();
  const [state, formAction] = useActionState<LoginResult | null, FormData>(loginAction, null);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  useEffect(() => {
    if (state && 'data' in state && state.data.redirectPath) {
      router.push(state.data.redirectPath);
    }
  }, [state, router]);

  return { form, formAction, state };
}

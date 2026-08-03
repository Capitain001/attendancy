"use client";

import Link from "next/link";
import { ArrowLeft, Eye, Lock, Mail } from "lucide-react";

import { Input } from "@/components/ui/input";
import { LoadButton } from "../ui/LoadButton";
import { ResourceIllustration } from "@/components/illustrations/Resourceillustration";

type Props = {
  form: {
    email: string;
    password: string;
  };

  message: string | null;
  success: boolean;
  isPending: boolean;

  formAction: (formData: FormData) => void;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
};

export function SignupPrincipalView({
  form,
  message,
  success,
  isPending,
  formAction,
  onChange,
}: Props) {
  return (
    <main className="min-h-screen bg-background">
      {/* CONTENT */}
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-10 px-6 pb-10 lg:flex-row lg:items-center">
        
        {/* FORM */}
        <section className="w-full max-w-md">
          <Link
            href="/"
            className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>

          <h1 className="text-3xl font-bold leading-tight">
            Create your principal account
          </h1>

          <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
            Set up your account to create your workspace.
          </p>

          {/* MESSAGE */}
          {message && (
            <div
              className={`mt-6 rounded-md border p-3 text-sm ${
                success
                  ? "border-green-200 bg-green-50 text-green-700"
                  : "border-red-200 bg-red-50 text-red-600"
              }`}
            >
              {message}
            </div>
          )}

          {/* FORM */}
          <form action={formAction} className="mt-6 space-y-5">
            
            {/* EMAIL */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>

              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                <Input
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={onChange}
                  className="h-11 pl-10"
                  required
                />
              </div>
            </div>

            {/* PASSWORD */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Password</label>

              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                <Input
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={onChange}
                  className="h-11 pl-10 pr-10"
                  required
                />

                <Eye className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              </div>

              <p className="text-xs text-muted-foreground">
                Use 8+ characters with numbers & symbols.
              </p>
            </div>

            {/* BUTTON */}
            <LoadButton
              loading={isPending}
              text="Create account"
              className="h-11 w-full"
            />
          </form>

          <div className="mt-8 text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-medium text-primary hover:underline"
            >
              Login
            </Link>
          </div>
        </section>

        {/* ILLUSTRATION */}
        <section className="flex flex-1 justify-center">
          <ResourceIllustration
            className="max-w-md"
            name="principal-sign-up"
          />
        </section>
      </div>
    </main>
  );
}
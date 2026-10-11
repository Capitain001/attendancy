import { useState } from "react";
import { SignupForm, type SignupCredentials } from "./signup-form";

export type SignupResult =
  | { error?: string | null }
  | { data: { email: string } };

export type SignupPageProps = {
  // Action injectée
  signup: (email: string, password: string) => Promise<SignupResult>;
  onLogin: () => void;
};

export function SignupPage({ signup, onLogin }: SignupPageProps) {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit({ email, password }: SignupCredentials) {
    setError(null);
    setSuccess(null);
    setIsPending(true);

    try {
      const result = await signup(email, password);
      if ("data" in result) {
        setSuccess(
          `Un e-mail de confirmation a été envoyé à ${result.data.email}.`,
        );
      } else {
        setError(result.error ?? "L'inscription a échoué.");
      }
    } catch (signupError) {
      setError(
        signupError instanceof Error
          ? signupError.message
          : "L'inscription a échoué.",
      );
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div className="flex flex-1 items-center justify-center bg-background p-4 text-foreground">
      <SignupForm
        error={error}
        success={success}
        isPending={isPending}
        onSubmit={handleSubmit}
        onLogin={onLogin}
      />
    </div>
  );
}

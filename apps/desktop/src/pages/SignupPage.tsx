import { useState } from "react";
import type { SignupCredentials } from "@attendancy/ui";
import { useNavigate } from "react-router-dom";
import { signupPersonal } from "@desktop/lib/auth/actions";
import { SignupView } from "@desktop/views/SignupView";

export function SignupPage() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit({ email, password }: SignupCredentials) {
    setError(null);
    setSuccess(null);
    setIsPending(true);

    try {
      const result = await signupPersonal(email, password);
      if ("error" in result) {
        setError(result.error ?? "L'inscription a échoué.");
      } else {
        setSuccess(
          `Un e-mail de confirmation a été envoyé à ${result.data.email}.`,
        );
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
    <main className="flex min-h-screen items-center justify-center bg-background p-4 text-foreground">
      <SignupView
        error={error}
        success={success}
        isPending={isPending}
        onSubmit={handleSubmit}
        onLogin={() => navigate("/login")}
      />
    </main>
  );
}

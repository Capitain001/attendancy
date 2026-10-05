import { useState } from "react";
import type { LoginCredentials } from "@attendancy/ui";
import { useNavigate } from "react-router-dom";
import { login } from "@desktop/lib/auth/actions";
import { LoginView } from "@desktop/views/LoginView";

export function LoginPage() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit(credentials: LoginCredentials) {
    setError(null);
    setIsPending(true);

    try {
      setError(await login(credentials));
    } catch (loginError) {
      setError(
        loginError instanceof Error
          ? loginError.message
          : "La connexion a échoué.",
      );
    } finally {
      setIsPending(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-4 text-foreground">
      <LoginView
        error={error}
        isPending={isPending}
        onSubmit={handleSubmit}
        onSignup={() => navigate("/signup")}
      />
    </main>
  );
}

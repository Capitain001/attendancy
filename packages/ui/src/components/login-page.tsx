import { useState } from "react";
import { LoginForm, type LoginCredentials } from "./login-form";

export type LoginPageProps = {
  // Action injectée : renvoie le message d'erreur, ou null en cas de succès
  login: (credentials: LoginCredentials) => Promise<string | null>;
  onSignup: () => void;
};

export function LoginPage({ login, onSignup }: LoginPageProps) {
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
    <div className="flex flex-1 items-center justify-center bg-background p-4 text-foreground">
      <LoginForm
        error={error}
        isPending={isPending}
        onSubmit={handleSubmit}
        onSignup={onSignup}
      />
    </div>
  );
}

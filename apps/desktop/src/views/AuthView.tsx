import { useState } from "react";
import type { LoginCredentials, SignupCredentials } from "@attendancy/ui";
import { useAuth } from "../hooks/useAuth";
import { useMe } from "../hooks/useMe";
import { login, logout, signupPersonal } from "../lib/account";
import { AccountView } from "./AccountView";
import { LoginView } from "./LoginView";
import { SignupView } from "./SignupView";

export function AuthView() {
  const [logoutError, setLogoutError] = useState<string | null>(null);
  const [authPage, setAuthPage] = useState<"login" | "signup">("login");
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState<string | null>(null);
  const [authPending, setAuthPending] = useState(false);
  const auth = useAuth();
  const loggedIn =
    auth?.status === "signed-in" || auth?.status === "offline-stale";
  const me = useMe(loggedIn);

  function showLogin() {
    setAuthPage("login");
    setAuthError(null);
    setAuthSuccess(null);
  }

  function showSignup() {
    setAuthPage("signup");
    setAuthError(null);
    setAuthSuccess(null);
  }

  async function handleLogin(credentials: LoginCredentials) {
    setAuthError(null);
    setAuthSuccess(null);
    setAuthPending(true);

    try {
      setAuthError(await login(credentials));
    } catch (error) {
      setAuthError(
        error instanceof Error ? error.message : "La connexion a échoué.",
      );
    } finally {
      setAuthPending(false);
    }
  }

  async function handleSignup({ email, password }: SignupCredentials) {
    setAuthError(null);
    setAuthSuccess(null);
    setAuthPending(true);

    try {
      const result = await signupPersonal(email, password);
      if ("error" in result) {
        setAuthError(result.error ?? "L'inscription a échoué.");
      } else {
        setAuthSuccess(
          `Un e-mail de confirmation a été envoyé à ${result.data.email}.`,
        );
      }
    } catch (error) {
      setAuthError(
        error instanceof Error ? error.message : "L'inscription a échoué.",
      );
    } finally {
      setAuthPending(false);
    }
  }

  async function handleLogout() {
    setLogoutError(null);
    try {
      await logout();
    } catch (error) {
      setLogoutError(
        error instanceof Error ? error.message : "La déconnexion a échoué.",
      );
    }
  }

  if (!auth) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background text-foreground">
        Chargement…
      </main>
    );
  }
  if (auth.status === "signed-out") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background p-4 text-foreground">
        {authPage === "login" ? (
          <LoginView
            error={authError}
            isPending={authPending}
            onSubmit={handleLogin}
            onSignup={showSignup}
          />
        ) : (
          <SignupView
            error={authError}
            success={authSuccess}
            isPending={authPending}
            onSubmit={handleSignup}
            onLogin={showLogin}
          />
        )}
      </main>
    );
  }
  if (me.data) return <AccountView user={me.data} />;
  if (me.isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background text-foreground">
        Chargement du profil…
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background p-6 text-foreground">
      <p role="alert" className="text-center text-destructive">
        {logoutError ??
          (me.error instanceof Error
            ? me.error.message
            : "Profil indisponible. Vérifiez votre connexion.")}
      </p>
      <button
        type="button"
        onClick={() => void handleLogout()}
        className="rounded-md border border-border px-4 py-2 text-sm font-medium"
      >
        Se déconnecter
      </button>
    </main>
  );
}

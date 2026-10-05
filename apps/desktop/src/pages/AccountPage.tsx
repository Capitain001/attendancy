import { useState } from "react";
import { useMe } from "@desktop/hooks/useMe";
import { logout } from "@desktop/lib/auth/actions";
import { AccountView } from "@desktop/views/AccountView";

export function AccountPage() {
  const me = useMe(true);
  const [logoutError, setLogoutError] = useState<string | null>(null);

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

//packages\ui\src\components\login-form.tsx
import type { FormEvent } from "react";

export type LoginCredentials = {
  email: string;
  password: string;
};

export type LoginFormProps = {
  error: string | null;
  isPending: boolean;
  onSubmit: (credentials: LoginCredentials) => void;
  onSignup: () => void;
};

export function LoginForm({
  error,
  isPending,
  onSubmit,
  onSignup,
}: LoginFormProps) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    onSubmit({
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? ""),
    });
  }

  // Keep only the Web form's content here; the desktop view owns the page layout.
  return (
    <div className="w-full max-w-sm space-y-6">
      <div className="flex flex-col items-center gap-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Connexion</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="login-email" className="text-sm font-medium">
            Email
          </label>
          <input
            id="login-email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="vous@etablissement.sn"
            className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="login-password" className="text-sm font-medium">
            Mot de passe
          </label>
          <input
            id="login-password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            placeholder="Votre mot de passe"
            className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {error ? (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={isPending}
          className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {isPending ? "Connexion en cours…" : "Se connecter"}
        </button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Pas encore de compte ?{" "}
        <button
          type="button"
          onClick={onSignup}
          className="font-medium text-foreground underline-offset-2 hover:underline"
        >
          Créez votre compte personnel
        </button>
      </p>
    </div>
  );
}

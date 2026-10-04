import type { FormEvent } from "react";

export type SignupCredentials = {
  email: string;
  password: string;
};

export type SignupFormProps = {
  error: string | null;
  success: string | null;
  isPending: boolean;
  onSubmit: (credentials: SignupCredentials) => void;
  onLogin: () => void;
};

export function SignupForm({
  error,
  success,
  isPending,
  onSubmit,
  onLogin,
}: SignupFormProps) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    onSubmit({
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? ""),
    });
  }

  // Match the Web personal-signup form; layout and authentication stay in the app.
  return (
    <div className="w-full max-w-sm space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          Créer votre compte
        </h1>
        <p className="text-sm text-muted-foreground">
          Créez un compte personnel Attendancy.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="signup-email" className="text-sm font-medium">
            Email
          </label>
          <input
            id="signup-email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="vous@exemple.com"
            required
            className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="signup-password" className="text-sm font-medium">
            Mot de passe
          </label>
          <input
            id="signup-password"
            name="password"
            type="password"
            autoComplete="new-password"
            placeholder="Minimum 8 caractères"
            minLength={8}
            required
            className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {error ? (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        ) : null}
        {success ? (
          <p role="status" className="text-sm text-muted-foreground">
            {success}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={isPending}
          className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {isPending ? "Inscription…" : "S'inscrire"}
        </button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Déjà un compte ?{" "}
        <button
          type="button"
          onClick={onLogin}
          className="font-medium text-foreground underline-offset-2 hover:underline"
        >
          Se connecter
        </button>
      </p>
    </div>
  );
}

'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { Fingerprint } from 'lucide-react';
import { forgotPassword } from '@/modules/auth/actions';
import { EmailConfirmationPendingCard } from '@/components/auth/ui/EmailConfirmationPendingCard';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
    >
      {pending ? 'Envoi en cours…' : 'Envoyer le lien de réinitialisation'}
    </button>
  );
}

export default function ForgotPassword() {
  const [state, formAction, isPending] = useActionState(forgotPassword, null);

  if (state && 'success' in state) {
    return (
      <EmailConfirmationPendingCard
        heading="Lien envoyé"
        message="Un lien de réinitialisation a été envoyé à votre adresse email."
        type="reset-password"
        resetSuccessMessage={() => {}}
      />
    );
  }

  return (
    <div className="w-full max-w-sm space-y-6">
      <div className="space-y-1">
        <Fingerprint className="size-8 text-muted-foreground" />
        <h1 className="text-2xl font-semibold tracking-tight">Mot de passe oublié</h1>
        <p className="text-sm text-muted-foreground">
          Entrez votre email pour recevoir un lien de réinitialisation.
        </p>
      </div>

      <form action={formAction} className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="vous@etablissement.sn"
            disabled={isPending}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
          />
        </div>

        {state && 'error' in state && (
          <p role="alert" className="text-sm text-destructive">
            {state.error}
          </p>
        )}

        <SubmitButton />
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Vous souvenez ?{' '}
        <a href="/auth/login" className="underline">
          Se connecter
        </a>
      </p>
    </div>
  );
}

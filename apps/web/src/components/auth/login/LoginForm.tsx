'use client'
import { login } from '@/modules/auth/actions'
import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import GoogleSignInButton from '../ui/GoogleSignInButton'

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
    >
      {pending ? 'Connexion en cours…' : 'Se connecter'}
    </button>
  )
}

export function LoginForm({ next }: { next?: string }) {
  const [state, formAction] = useActionState(login, null)

  return (
    <div className="w-full max-w-sm space-y-6">
      <div className="gap-y-1 flex flex-col items-center">
        <h1 className="text-2xl font-semibold tracking-tight">Connexion</h1>
      </div>

      <form action={formAction} className="space-y-4">
        {next && <input type="hidden" name="next" value={next} />}

        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="vous@etablissement.sn"
            className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label htmlFor="password" className="text-sm font-medium">Mot de passe</label>
            <a href="/auth/forgot-password" className="text-xs text-muted-foreground underline hover:text-foreground">
              Mot de passe oublié ?
            </a>
          </div>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            placeholder="Votre mot de passe"
            className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {state?.error && (
          <p role="alert" className="text-sm text-destructive">{state.error}</p>
        )}

        <SubmitButton />
      </form>

            <div className="my-2 flex items-center gap-3 before:h-px before:flex-1 before:bg-border after:h-px after:flex-1 after:bg-border">
              <span className="text-xs text-muted-foreground">Or</span>
            </div>

            <div className="flex flex-col gap-y-2">
              <GoogleSignInButton className="w-full rounded-md border-2"/>
              <div className=" space-y-2">
                <p className="text-center text-sm text-muted-foreground">
                  Pas encore de compte ?{" "}
                  <a
                    href="/auth/signup"
                    className="font-medium text-foreground underline-offset-2 hover:underline"
                  >
                    Créez votre établissement
                  </a>
                </p>
                <p className="text-center text-xs text-muted-foreground">
                  Si vous n'avez pas reçu d'invitation, contactez votre
                  établissement ou{" "}
                  <a
                    className="underline hover:no-underline"
                    href="mailto:capitainstuart@gmail.com"
                  >
                    laissez-nous un message
                  </a>
                  .
                </p>
              </div>
            </div>

    </div>
  )
}

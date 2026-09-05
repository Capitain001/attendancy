'use client'
import { useActionState } from 'react'

import { SubmitButton } from '../ui'
import { signupPrincipalAction } from '@/modules/auth'



export function SignupPrincipalForm() {
  const [state, formAction] = useActionState(signupPrincipalAction, null)

  return (
    <div className="w-full max-w-sm space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Créer votre compte</h1>
        <p className="text-sm text-muted-foreground">
          Inscrivez-vous en tant que direction d&apos;établissement
        </p>
      </div>

      <form action={formAction} className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="direction@etablissement.sn"
            className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="password" className="text-sm font-medium">Mot de passe</label>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="new-password"
            placeholder="Minimum 8 caractères"
            className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {state?.error && (
          <p role="alert" className="text-sm text-destructive">{state.error}</p>
        )}

        <SubmitButton />
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Déjà un compte ?{' '}
        <a href="/login" className="underline">Se connecter</a>
      </p>
    </div>
  )
}

'use client'
import { useActionState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { signupPrincipalAction } from '@/services/auth/actions'
import type { SignupResult } from '@/services/auth/types'

export function SignupPrincipalForm() {
  const router = useRouter()
  const [state, formAction, isPending] = useActionState<SignupResult | null, FormData>(
    async (_prev, formData) =>
      signupPrincipalAction({
        email:    formData.get('email') as string,
        password: formData.get('password') as string,
      }),
    null,
  )

  useEffect(() => {
    if (state && 'data' in state) {
      router.push('/auth/check-email')
    }
  }, [state, router])

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

        {state && 'error' in state && (
          <p role="alert" className="text-sm text-destructive">{state.error}</p>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {isPending ? 'Création en cours…' : 'Créer mon compte'}
        </button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Déjà un compte ?{' '}
        <a href="/login" className="underline">Se connecter</a>
      </p>
    </div>
  )
}

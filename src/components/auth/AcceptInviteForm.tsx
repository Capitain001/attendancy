'use client'
import { useActionState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { acceptInviteAction } from '@/services/invite'
import type { AcceptInviteResult } from '@/services/invite/types'

type Props = {
  token:     string
  orgName:   string
  roleLabel: string
  userEmail: string
}

export function AcceptInviteForm({ token, orgName, roleLabel, userEmail }: Props) {
  const router = useRouter()
  const [state, formAction, isPending] = useActionState<AcceptInviteResult | null, FormData>(
    async (_prev, formData) =>
      acceptInviteAction({
        token:     formData.get('token') as string,
        firstName: formData.get('firstName') as string || undefined,
        lastName:  formData.get('lastName')  as string || undefined,
      }),
    null,
  )

  useEffect(() => {
    if (state && 'data' in state) {
      router.push(state.data.redirectPath)
    }
  }, [state, router])

  return (
    <div className="w-full max-w-md space-y-6 rounded-2xl border bg-card p-8 shadow-sm">
      <div className="space-y-1 text-center">
        <h1 className="text-2xl font-bold">Rejoindre {orgName}</h1>
        <p className="text-sm text-muted-foreground">
          Vous avez été invité en tant que <strong>{roleLabel}</strong>
        </p>
        <p className="text-xs text-muted-foreground">{userEmail}</p>
      </div>

      <form action={formAction} className="space-y-4">
        <input type="hidden" name="token" value={token} />

        <div className="space-y-2">
          <label htmlFor="firstName" className="block text-sm font-medium">
            Prénom <span className="text-muted-foreground">(optionnel)</span>
          </label>
          <input
            id="firstName"
            name="firstName"
            type="text"
            autoComplete="given-name"
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="lastName" className="block text-sm font-medium">
            Nom <span className="text-muted-foreground">(optionnel)</span>
          </label>
          <input
            id="lastName"
            name="lastName"
            type="text"
            autoComplete="family-name"
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {state && 'error' in state && (
          <p className="text-sm text-destructive">{state.error}</p>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {isPending ? 'Traitement…' : `Rejoindre ${orgName}`}
        </button>
      </form>
    </div>
  )
}

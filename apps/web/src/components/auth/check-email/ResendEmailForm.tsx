'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { resendSignupEmailAction } from '@/modules/auth'

function ResendButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="text-sm underline cursor-pointer text-primary hover:text-primary/80 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {pending ? 'Envoi en cours…' : 'Renvoyer l\'email'}
    </button>
  )
}

export function ResendEmailForm({ email }: { email: string }) {
  const [state, formAction] = useActionState(resendSignupEmailAction, null)

  if (state?.success) {
    return (
      <p className="text-sm text-green-600">
        Email renvoyé à <strong>{email}</strong>. Vérifiez votre boîte.
      </p>
    )
  }

  return (
    <form action={formAction} className="inline">
      <input type="hidden" name="email" value={email} />
      {state?.error && (
        <p role="alert" className="text-sm text-destructive mb-1">{state.error}</p>
      )}
      <ResendButton />
    </form>
  )
}

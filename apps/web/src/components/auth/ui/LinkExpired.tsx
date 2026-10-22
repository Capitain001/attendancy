'use client'
import { useId, useState, useTransition } from 'react'
import type { FormEvent } from 'react'
import Link from 'next/link'
import { Check, Loader2, MailWarning } from 'lucide-react'
import { cn } from '@/lib/utils'
import { button, card, input, layout, typography } from '@/styles'
import { resendSignupEmailAction } from '@/modules/auth'

export function LinkExpired() {
  const emailId = useId()
  const [email, setEmail] = useState('')
  const [pending, startTransition] = useTransition()
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const canSubmit = email.trim().length > 0 && !pending

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!canSubmit) return
    setError(null)

    startTransition(async () => {
      try {
        const res = await resendSignupEmailAction({ email })
        if (res.success) setDone(true)
        else setError(res.error ?? "Échec de l'envoi.")
      } catch {
        setError("Échec de l'envoi.")
      }
    })
  }

  return (
    <div className={cn(layout.center, 'min-h-screen bg-muted/30 p-4')}>
      <div className={cn(card.base, 'w-full max-w-md space-y-5')}>
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="grid size-10 place-items-center rounded-lg bg-muted text-heading">
            <MailWarning className="size-5" aria-hidden />
          </div>
          <h1 className={typography.h6}>Lien expiré</h1>
          <p className={typography.body}>
            Ce lien de confirmation est invalide ou a expiré. Saisis ton email pour recevoir un nouveau lien.
          </p>
        </div>

        {done ? (
          <div
            role="status"
            className="flex items-center justify-center gap-2 rounded-lg bg-primary/10 px-3 py-3 text-sm text-primary"
          >
            <Check className="size-4" aria-hidden /> Email envoyé, vérifie ta boîte mail.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className={layout.stack} noValidate>
            {error && (
              <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            )}

            <label htmlFor={emailId} className={input.label}>
              Adresse email
            </label>
            <input
              id={emailId}
              type="email"
              name="email"
              inputMode="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ton.email@etablissement.sn"
              className={input.base}
            />

            <button
              type="submit"
              disabled={!canSubmit}
              className={cn(button.primary, button.fullWidth, 'disabled:cursor-not-allowed disabled:opacity-50')}
            >
              {pending && <Loader2 className="size-4 animate-spin" aria-hidden />}
              Renvoyer le lien
            </button>
          </form>
        )}

        <p className={cn(typography.small, 'text-center')}>
          <Link href="/login" className="font-medium text-foreground hover:underline">
            Retour à la connexion
          </Link>
        </p>
      </div>
    </div>
  )
}
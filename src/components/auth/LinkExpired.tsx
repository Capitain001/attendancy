'use client'
import { useState, useTransition } from 'react'
import Link from 'next/link'
import { Check, Loader2, MailWarning } from 'lucide-react'
import { cn } from '@/lib/utils'
import { button, card, input, layout, typography } from '@/styles'
import { resendSignupEmail } from '@/services/auth'

export function LinkExpired() {
  const [email, setEmail]          = useState('')
  const [pending, startTransition] = useTransition()
  const [done, setDone]            = useState(false)
  const [error, setError]          = useState<string | null>(null)

  function resend() {
    if (!email.trim()) return
    setError(null)
    startTransition(async () => {
      const res = await resendSignupEmail(email.trim())
      if (res.success) setDone(true)
      else setError(res.error ?? "Échec de l'envoi.")
    })
  }

  return (
    <div className={cn(layout.center, 'min-h-screen bg-muted/30 p-4')}>
      <div className={cn(card.base, 'w-full max-w-md space-y-5')}>
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="grid size-10 place-items-center rounded-lg bg-amber-500/15 text-amber-600">
            <MailWarning className="size-5" />
          </div>
          <h1 className={typography.h6}>Lien expiré</h1>
          <p className={typography.body}>
            Ce lien de confirmation est invalide ou a expiré. Renvoie-toi un nouveau lien.
          </p>
        </div>

        {done ? (
          <div className="flex items-center justify-center gap-2 rounded-lg bg-emerald-500/10 px-3 py-3 text-sm text-emerald-600">
            <Check className="size-4" /> Email envoyé — vérifie ta boîte mail.
          </div>
        ) : (
          <div className={layout.stack}>
            {error && (
              <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
            )}
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="vous@etablissement.sn"
              className={input.base}
            />
            <button
              type="button"
              onClick={resend}
              disabled={pending || !email.trim()}
              className={cn(button.primary, button.fullWidth, 'disabled:opacity-50')}
            >
              {pending ? <Loader2 className="size-4 animate-spin" /> : null}
              Renvoyer le lien
            </button>
          </div>
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

'use client'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { button, card, layout, typography } from '@/styles'

const ERROR_MESSAGES: Record<string, string> = {
  access_denied:     "Accès refusé. Vous n'avez pas les permissions nécessaires.",
  invalid_request:   'Requête invalide. Veuillez réessayer.',
  server_error:      'Erreur serveur. Veuillez réessayer plus tard.',
  invalid_token:     'Token invalide ou expiré.',
  session_not_found: 'Session introuvable. Veuillez vous reconnecter.',
  callback_failed:   "Échec de l'authentification. Veuillez réessayer.",
  invite_invalid:    'Invitation invalide ou expirée.',
  invite_mismatch:   "L'invitation ne correspond pas à votre compte.",
}

export function AuthError() {
  const searchParams = useSearchParams()
  const error        = searchParams.get('error') ?? ''
  const description  = searchParams.get('error_description')

  const message = description
    ?? ERROR_MESSAGES[error]
    ?? "Une erreur est survenue lors de l'authentification."

  return (
    <div className={cn(layout.center, 'min-h-screen bg-muted/30 p-4')}>
      <div className={cn(card.base, 'w-full max-w-md space-y-5 text-center')}>
        <div className="flex flex-col items-center gap-2">
          <div className="grid size-10 place-items-center rounded-lg bg-destructive/10 text-destructive">
            <AlertCircle className="size-5" />
          </div>
          <h1 className={typography.h6}>Erreur d&apos;authentification</h1>
          <p className={typography.body}>{message}</p>
        </div>

        <div className={layout.stack}>
          <Link href="/login" className={cn(button.primary, button.fullWidth)}>
            Retour à la connexion
          </Link>
          <Link href="/" className={cn(button.secondary, button.fullWidth)}>
            Accueil
          </Link>
        </div>
      </div>
    </div>
  )
}

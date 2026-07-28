import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Vérifiez votre email | Attendancy',
  description: "Un lien de confirmation a été envoyé à votre adresse email.",
  robots: { index: false, follow: false },
}

export default function CheckEmailPage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-4">
        <h1 className="text-2xl font-semibold">Vérifiez votre email</h1>
        <p className="text-muted-foreground">
          Un lien de confirmation a été envoyé à votre adresse. Cliquez dessus pour activer votre compte.
        </p>
        <p className="text-sm text-muted-foreground">
          Pas reçu ?{' '}
          <Link href="/auth/signup-principal" className="underline">
            Réessayer
          </Link>
        </p>
      </div>
    </main>
  )
}

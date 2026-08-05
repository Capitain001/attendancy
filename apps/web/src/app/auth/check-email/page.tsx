import { connection } from 'next/server'
import type { Metadata } from 'next'
import Link from 'next/link'
import { ResendEmailForm } from '@/components/auth/check-email/ResendEmailForm'

export const metadata: Metadata = {
  title: 'Vérifiez votre email | Attendancy',
  description: "Un lien de confirmation a été envoyé à votre adresse email.",
  robots: { index: false, follow: false },
}

export default async function CheckEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>
}) {
  await connection()
  const { email } = await searchParams

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-4">
        <h1 className="text-2xl font-semibold">Vérifiez votre email</h1>
        {email && (
          <p className="text-sm font-medium text-foreground">
            Lien envoyé à <strong>{email}</strong>
          </p>
        )}
        <p className="text-muted-foreground">
          Cliquez sur le lien dans l&apos;email pour activer votre compte.
        </p>
        <p className="text-sm text-muted-foreground">
          Pas reçu ?{' '}
       
        </p>
           {email ? (
            <ResendEmailForm email={email} />
          ) : (
            <Link href="/auth/signup/principal" className="underline cursor-pointer ">
              Réessayer
            </Link>
          )}
      </div>
    </main>
  )
}

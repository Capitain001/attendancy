import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getUserInfo } from '@/modules/user'
import { redirectUser } from '@/config/redirects'
import { SignupPrincipalForm } from '@/components/auth/signup/SignupPrincipalForm'


export const metadata: Metadata = {
  title: 'Créer votre compte | Attendancy',
  description: "Inscrivez-vous en tant que direction d'établissement pour créer votre espace Attendancy.",
  robots: { index: false, follow: false },
}

export default async function SignupPrincipalPage() {
  const user = await getUserInfo()
  if (user?.id) redirect(redirectUser(user))

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <SignupPrincipalForm />
    </main>
  )
}

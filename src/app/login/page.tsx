import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getUserInfo } from '@/services/user/userInfo'
import { redirectUser } from '@/config/redirects'
import { LoginForm } from '@/components/auth/LoginForm'

export const metadata: Metadata = {
  title: 'Connexion | Attendancy',
  description: 'Connectez-vous à votre espace Attendancy.',
  robots: { index: false, follow: false },
}

type Props = { searchParams: Promise<{ next?: string }> }

export default async function LoginPage({ searchParams }: Props) {
  const user = await getUserInfo()
  if (user?.id) redirect(redirectUser(user))

  const { next } = await searchParams

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <LoginForm next={next} />
    </main>
  )
}

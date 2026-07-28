import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getUserInfo } from '@/services/user/userInfo'
import { redirectUser } from '@/config/redirects'
import { OrgSetupForm } from '@/components/auth/OrgSetupForm'

export const metadata: Metadata = {
  title: 'Configurer votre établissement | Attendancy',
  robots: { index: false, follow: false },
}

export default async function OrgSetupPage() {
  const user = await getUserInfo()

  if (!user?.id) redirect('/login')

  // Déjà une org → aller au dashboard
  if (user.organization?.slug) redirect(redirectUser(user))

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <OrgSetupForm />
    </main>
  )
}

import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getUserInfo } from '@/modules/user'
import { redirectUser } from '@/config/redirects'
import ForgotPassword from '@/components/auth/password/ForgotPassword'

export const metadata: Metadata = {
  title: 'Mot de passe oublié | Attendancy',
  robots: { index: false, follow: false },
}

export default async function ForgotPasswordPage() {
  const user = await getUserInfo()
  if (user?.id) redirect(redirectUser(user))

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <ForgotPassword />
    </div>
  )
}

import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getUserInfo } from '@/modules/user'
import { redirectUser } from '@/config/redirects'
import { SignupLanding } from '@/components/auth/signup/SignupLanding'


export const metadata: Metadata = {
  title: 'Créer un compte | Attendancy',
  robots: { index: false, follow: false },
}

export default async function SignupPage() {
  const user = await getUserInfo()
  if (user?.id) redirect(redirectUser(user))

  return <SignupLanding />
}

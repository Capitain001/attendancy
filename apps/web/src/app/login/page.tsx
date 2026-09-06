import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Image from 'next/image'
import { getUserInfo } from '@/modules/user'
import { redirectUser } from '@/config/redirects'
import { LoginForm } from '@/components/auth/login/LoginForm'
import { images } from '@/config/images'

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
    <main className="flex h-[calc(100dvh-3.625rem)] bg-background">
 

      {/* Colonne gauche  : image (masquée sur mobile) */}
      <div className="relative hidden lg:block lg:w-1/2">
        <Image
          src={images.illustration.loginHero}
          alt="Illustration Attendancy"
          fill
          priority
          className="object-cover opacity-20"
        />
      </div>
           {/* Colonne droite : formulaire */}
      <div className="flex w-full lg:w-1/2 items-center justify-center p-4">
        <LoginForm next={next} />
      </div>
    </main>
  )
}
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { button, card, layout, typography } from '@/styles'

export function SignupLanding() {
  return (
    <main className={cn(layout.page, 'flex min-h-screen flex-col items-center justify-center gap-10 py-16')}>
      <div className="space-y-3 text-center">
        <h1 className={typography.h3}>Créez votre espace Attendancy</h1>
        <p className={cn(typography.large, 'max-w-lg')}>
          Organisez votre établissement en quelques minutes.
        </p>
      </div>

      <div className="grid w-full max-w-3xl gap-6 md:grid-cols-2">
        <div className={cn(card.interactive, 'flex flex-col gap-4 p-6')}>
          <div>
            <p className={typography.label}>Direction</p>
            <h2 className={cn(typography.h6, 'mt-1')}>Chef d&apos;établissement</h2>
            <p className={cn(typography.body, 'mt-2')}>
              Créez l&apos;espace de travail de votre établissement, invitez votre personnel
              et gérez toutes vos activités depuis un seul endroit.
            </p>
          </div>
          <Link href="/auth/signup/principal" className={cn(button.primary, 'mt-auto gap-2')}>
            Continuer <ArrowRight className="size-4" />
          </Link>
        </div>

        <div className={cn(card.interactive, 'flex flex-col gap-4 p-6')}>
          <div>
            <p className={typography.label}>Découverte</p>
            <h2 className={cn(typography.h6, 'mt-1')}>Explorer la démo</h2>
            <p className={cn(typography.body, 'mt-2')}>
              Découvrez Attendancy avec un espace préconfiguré et explorez toutes
              les fonctionnalités de la plateforme.
            </p>
          </div>
          <Link href="/demo" className={cn(button.secondary, 'mt-auto gap-2')}>
            Lancer la démo <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>

      <p className={typography.body}>
        Vous avez déjà un compte ?{' '}
        <Link href="/login" className="font-medium text-foreground hover:underline">
          Se connecter
        </Link>
      </p>
    </main>
  )
}

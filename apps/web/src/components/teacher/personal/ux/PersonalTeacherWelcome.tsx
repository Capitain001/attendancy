// components/teacher/personal/ux/PersonalTeacherWelcome.tsx
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { rippleButtonClasses } from '@/components/ui/ripple-button'
import { personal } from '@/services/personal/paths'

type Props = {
  slug: string
}

export function PersonalTeacherWelcome({ slug }: Props) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-8 text-center">
        <h1 className="text-3xl font-semibold tracking-tight">
          Bienvenue dans votre espace personnel
        </h1>
        <p className="text-sm text-muted-foreground">
          Pour démarrer, appuyez sur le bouton.
        </p>
        <Link
          href={personal.home(slug)}
          className={cn(
            rippleButtonClasses,
            'inline-flex items-center justify-center gap-2 py-2.5 pl-5 pr-4'
          )}
        >
          Démarrer
          <ArrowRight aria-hidden="true" className="size-4" />
        </Link>
      </div>
    </main>
  )
}
'use client'
import Link from 'next/link'
import NewUserPage from '@/components/auth/signup/flow/invited/NewUserPage'
import type { UserInfo } from '@/types/user'
import { typography } from '@/styles'
import { cn } from '@/lib/utils'

const mockUser: UserInfo = {
  id: 'mock',
  email: 'marie.dupont@gmail.com',
  name: 'Marie Dupont',
  role: 'TEACHER',
  organization: { id: 'org', name: 'Institut Supérieur Privé de Cotonou', slug: 'ispc' },
}

const steps = [
  { label: 'Invitation',    done: true },
  { label: 'Vérification',  done: true },
  { label: 'Activation',    done: false },
]

/** T4 — Step Journey
 *  Progress indicator explicite en haut (règle UX : montrer la progression).
 *  Flow occupe l'espace principal — l'utilisateur sait où il en est. */
export default function Template4() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="bg-card border-b border-border px-6 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold">A</div>
          <span className="text-sm font-semibold text-foreground">Attendancy</span>
        </div>
        <Link href="/test/welcome" className={cn(typography.small, 'hover:text-foreground transition-colors')}>← Galerie</Link>
      </header>

      {/* Progress bar */}
      <div className="h-0.5 bg-border">
        <div className="h-full bg-primary transition-all" style={{ width: '100%' }} />
      </div>

      {/* Stepper */}
      <div className="flex justify-center py-6 px-4 bg-card border-b border-border">
        <div className="flex items-center gap-0">
          {steps.map((s, i) => (
            <div key={s.label} className="flex items-center">
              <div className="flex flex-col items-center gap-1">
                <div className={cn(
                  'w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-colors',
                  s.done
                    ? 'bg-primary border-primary text-primary-foreground'
                    : 'bg-background border-primary text-primary'
                )}>
                  {s.done ? '✓' : i + 1}
                </div>
                <span className={cn(
                  'text-[10px] font-medium',
                  s.done || !s.done && i === 2 ? 'text-foreground' : 'text-muted-foreground'
                )}>
                  {s.label}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div className={cn('w-16 h-0.5 mb-4 mx-1', s.done ? 'bg-primary' : 'bg-border')} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Context strip */}
      <div className="bg-muted/50 border-b border-border px-6 py-3 flex items-center gap-2">
        <div className="w-5 h-5 rounded bg-primary flex items-center justify-center text-primary-foreground text-[10px] font-bold shrink-0">IS</div>
        <p className={typography.small}>
          <span className="text-foreground font-medium">{mockUser.organization?.name}</span>
          {' '}· Étape 3 sur 3 — Activation du compte
        </p>
      </div>

      {/* Flow */}
      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-sm h-[420px]">
          <NewUserPage user={mockUser} />
        </div>
      </main>
    </div>
  )
}

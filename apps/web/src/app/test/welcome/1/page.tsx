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

/** T1 — Minimal Trust
 *  Fond neutre, identité org en ancre haute, flow centré, footer plateforme.
 *  Pas de carte : le contenu parle seul. */
export default function Template1() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Org anchor */}
      <header className="border-b border-border bg-card px-6 py-4 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold shrink-0">
          IS
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground leading-none">{mockUser.organization?.name}</p>
          <p className={cn(typography.small, 'mt-0.5')}>Invitation confirmée · Enseignante</p>
        </div>
        <Link href="/test/welcome" className={cn(typography.small, 'ml-auto hover:text-foreground transition-colors')}>← Galerie</Link>
      </header>

      {/* Flow */}
      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-sm h-[460px]">
          <NewUserPage user={mockUser} />
        </div>
      </main>

      {/* Footer plateforme */}
      <footer className="border-t border-border px-6 py-3 text-center">
        <p className={typography.small}>Attendancy · Plateforme de gestion académique</p>
      </footer>
    </div>
  )
}

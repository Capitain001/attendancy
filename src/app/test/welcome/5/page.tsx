'use client'
import Link from 'next/link'
import NewUserPage from '@/components/auth/signup/flow/invited/NewUserPage'
import type { UserInfo } from '@/types/user'
import { card, typography } from '@/styles'
import { cn } from '@/lib/utils'

const mockUser: UserInfo = {
  id: 'mock',
  email: 'marie.dupont@gmail.com',
  name: 'Marie Dupont',
  role: 'TEACHER',
  organization: { id: 'org', name: 'Institut Supérieur Privé de Cotonou', slug: 'ispc' },
}

/** T5 — Immersive Header
 *  Grand bloc org en haut (fond card, logo centré, nom, inviteur).
 *  Le flow s'ouvre dessous sur fond neutre — impression d'entrée dans l'org. */
export default function Template5() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Hero org */}
      <div className="bg-card border-b border-border">
        <div className="max-w-sm mx-auto px-6 py-10 flex flex-col items-center text-center gap-3">
          <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center text-primary-foreground font-bold text-2xl">
            IS
          </div>
          <div>
            <h1 className="text-base font-semibold text-foreground">{mockUser.organization?.name}</h1>
            <p className={cn(typography.small, 'mt-0.5')}>
              Invitation de <span className="text-foreground font-medium">Dr. Jean Ahounou</span>
            </p>
          </div>
          <div className={cn(card.soft, 'inline-flex items-center gap-1.5 px-3 py-1 rounded-full')}>
            <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block shrink-0" />
            <span className="text-xs font-medium text-foreground">Enseignante</span>
          </div>
        </div>
      </div>

      {/* Flow */}
      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-sm h-[420px]">
          <NewUserPage user={mockUser} />
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border px-6 py-3 flex items-center justify-between">
        <p className={typography.small}>Attendancy</p>
        <Link href="/test/welcome" className={cn(typography.small, 'hover:text-foreground transition-colors')}>← Galerie</Link>
      </footer>
    </div>
  )
}

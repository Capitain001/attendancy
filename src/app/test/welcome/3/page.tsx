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

/** T3 — Split Authority
 *  Sidebar gauche : branding org + signal de confiance (inviteur, rôle).
 *  Droite : flow sur fond neutre, sans décoration. */
export default function Template3() {
  return (
    <div className="min-h-screen flex">
      {/* Sidebar — identité & confiance */}
      <aside className="hidden md:flex w-72 bg-sidebar border-r border-border flex-col shrink-0">
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold shrink-0">A</div>
            <span className="text-sm font-semibold text-foreground">Attendancy</span>
          </div>
        </div>

        <div className="flex-1 flex flex-col justify-center px-8 gap-6">
          <div>
            <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-border flex items-center justify-center text-primary font-bold text-xl mb-4">
              IS
            </div>
            <p className={cn(typography.label, 'mb-1')}>Organisation</p>
            <h2 className="text-sm font-semibold text-foreground leading-snug">{mockUser.organization?.name}</h2>
          </div>

          <div className="border-t border-border pt-5 flex flex-col gap-3">
            <div>
              <p className={cn(typography.label, 'mb-0.5')}>Rôle attribué</p>
              <p className="text-sm font-medium text-foreground">Enseignante</p>
            </div>
            <div>
              <p className={cn(typography.label, 'mb-0.5')}>Invité(e) par</p>
              <p className="text-sm font-medium text-foreground">Dr. Jean Ahounou</p>
            </div>
            <div>
              <p className={cn(typography.label, 'mb-0.5')}>Compte</p>
              <p className={cn(typography.small)}>marie.dupont@gmail.com</p>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-border">
          <p className={typography.small}>Plateforme de gestion académique</p>
        </div>
      </aside>

      {/* Flow principal */}
      <div className="flex-1 bg-background flex flex-col">
        <div className="px-6 py-4 flex justify-end border-b border-border">
          <Link href="/test/welcome" className={cn(typography.small, 'hover:text-foreground transition-colors')}>← Galerie</Link>
        </div>
        <div className="flex-1 flex items-center justify-center px-6 py-8">
          <div className="w-full max-w-sm h-[460px]">
            <NewUserPage user={mockUser} />
          </div>
        </div>
      </div>
    </div>
  )
}

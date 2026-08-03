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

/** T2 — Elevated Card
 *  Fond muted, carte surélevée avec header org et footer inviteur.
 *  Tout le flow vit dans la carte — identité + action au même endroit. */
export default function Template2() {
  return (
    <div className="min-h-screen bg-muted flex flex-col items-center justify-center p-4">
      <Link href="/test/welcome" className={cn(typography.small, 'mb-5 hover:text-foreground transition-colors')}>← Galerie</Link>

      <div className={cn(card.elevated, 'w-full max-w-sm rounded-2xl p-0 overflow-hidden')}>
        {/* Card header — identité org */}
        <div className="px-7 pt-7 pb-5 border-b border-border flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm shrink-0">
            IS
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">{mockUser.organization?.name}</p>
            <p className={cn(typography.small, 'mt-0.5')}>Vous a invité(e) en tant qu'Enseignante</p>
          </div>
        </div>

        {/* Flow */}
        <div className="px-7 py-6 h-[400px] flex flex-col justify-center">
          <NewUserPage user={mockUser} />
        </div>

        {/* Card footer — inviteur + plateforme */}
        <div className="px-7 py-4 border-t border-border flex items-center justify-between">
          <p className={typography.small}>Invité par <span className="text-foreground font-medium">Dr. Jean Ahounou</span></p>
          <p className={typography.small}>Attendancy</p>
        </div>
      </div>
    </div>
  )
}

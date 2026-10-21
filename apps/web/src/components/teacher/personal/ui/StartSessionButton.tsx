// components/teacher/personal/ui/StartSessionButton.tsx
'use client'

import Link from 'next/link'
import { LogIn } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useSessionState, type DBSession } from '@/hooks/data/sessions/use-session-state'
import { scheduleStartMessages as m } from '@/lib/data/schedule'

type Props = {
  schedule: { startTime: Date; endTime: Date; session: DBSession }
  /** Page où la séance se démarre (la logique de démarrage y vit déjà). */
  href: string
}

/**
 * Lien-bouton vers la page de démarrage, affiché uniquement quand la séance est prête
 * (policy session : `canCheckIn`, soit fenêtre check-in ouverte et aucune session).
 * Ne démarre rien lui-même : il navigue.
 */
export function StartSessionButton({ schedule, href }: Props) {
  const { canCheckIn } = useSessionState({
    startTime: schedule.startTime,
    endTime: schedule.endTime,
    session: schedule.session,
  })

  if (!canCheckIn) return null

  return (
    <Button asChild size="lg" className="h-12 w-full rounded-md">
      <Link href={href}>
        <LogIn aria-hidden="true" className="size-4" />
        {m.start}
      </Link>
    </Button>
  )
}
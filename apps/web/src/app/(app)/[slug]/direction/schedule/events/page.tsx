import { connection } from 'next/server'
import { card, typography } from '@/styles'
import { cn } from '@/lib/utils'
import { CalendarCheck2 } from 'lucide-react'

export default async function EventsPage() {
  await connection()

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-base font-semibold text-text-primary">Événements</h1>
      <div className={cn(card.soft, 'py-12 text-center')}>
        <CalendarCheck2 className="mx-auto mb-3 size-8 text-text-subtle" strokeWidth={1} />
        <p className={typography.body}>Section en cours de développement.</p>
        <p className={typography.small}>La gestion des événements organisationnels sera disponible prochainement.</p>
      </div>
    </div>
  )
}

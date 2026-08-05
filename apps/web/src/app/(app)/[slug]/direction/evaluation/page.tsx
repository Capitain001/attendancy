import { connection } from 'next/server'
import { card, typography } from '@/styles'
import { cn } from '@/lib/utils'
import { ClipboardList } from 'lucide-react'

export default async function EvaluationPage() {
  await connection()

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-base font-semibold text-text-primary">Évaluations</h1>
      <div className={cn(card.soft, 'py-12 text-center')}>
        <ClipboardList className="mx-auto mb-3 size-8 text-text-subtle" strokeWidth={1} />
        <p className={typography.body}>Section en cours de développement.</p>
        <p className={typography.small}>La vue globale des évaluations par classe et par terme sera disponible prochainement.</p>
      </div>
    </div>
  )
}

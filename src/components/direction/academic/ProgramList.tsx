import { School } from 'lucide-react'
import { card, typography } from '@/styles'
import { cn } from '@/lib/utils'

type ProgramTrack = {
  id: string
  name: string
  description: string | null
  department: { id: string; name: string }
  _count: { classes: number }
}

export function ProgramList({ programs }: { programs: ProgramTrack[] }) {
  if (programs.length === 0) {
    return (
      <div className={cn(card.soft, 'py-12 text-center')}>
        <School className="mx-auto mb-3 size-8 text-text-subtle" strokeWidth={1} />
        <p className={typography.body}>Aucune filière créée.</p>
      </div>
    )
  }

  return (
    <div className="grid gap-3 md:grid-cols-2">
      {programs.map((p) => (
        <div key={p.id} className={cn(card.base, 'flex flex-col gap-2')}>
          <div className="flex items-start justify-between gap-2">
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-medium text-text-primary">{p.name}</span>
              <span className={typography.small}>{p.department.name}</span>
            </div>
            <span className={cn(
              'shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary'
            )}>
              {p._count.classes} classe{p._count.classes !== 1 ? 's' : ''}
            </span>
          </div>
          {p.description && (
            <p className={cn(typography.small, 'line-clamp-2')}>{p.description}</p>
          )}
        </div>
      ))}
    </div>
  )
}

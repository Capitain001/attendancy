import { card, typography } from '@/styles'
import { cn } from '@/lib/utils'
import type { GetTeacherDto, GetTeacherNotNull } from '@/services/teacher'

export function TeacherStatsSection({
  teacher,
  upcomingCount,
  pastCount,
  unavailabilitiesCount,
}: {
  teacher: GetTeacherNotNull
  upcomingCount: number
  pastCount: number
  unavailabilitiesCount: number
}) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      <div className={cn(card.soft, 'flex flex-col gap-1 p-4')}>
        <span className="text-2xl font-bold text-text-primary">{teacher._count.courses}</span>
        <span className={cn(typography.small, 'text-muted-foreground')}>Cours affectés</span>
      </div>
      <div className={cn(card.soft, 'flex flex-col gap-1 p-4')}>
        <span className="text-2xl font-bold text-text-primary">{upcomingCount}</span>
        <span className={cn(typography.small, 'text-muted-foreground')}>Séances prévues</span>
      </div>
      <div className={cn(card.soft, 'flex flex-col gap-1 p-4')}>
        <span className="text-2xl font-bold text-text-primary">{pastCount}</span>
        <span className={cn(typography.small, 'text-muted-foreground')}>Séances passées</span>
      </div>
      <div className={cn(card.soft, 'flex flex-col gap-1 p-4')}>
        <span className="text-2xl font-bold text-text-primary">{unavailabilitiesCount}</span>
        <span className={cn(typography.small, 'text-muted-foreground')}>Indisponibilités</span>
      </div>
    </div>
  )
}

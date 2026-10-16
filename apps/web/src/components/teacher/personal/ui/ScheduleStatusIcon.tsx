// components/teacher/personal/ui/ScheduleStatusIcon.tsx
import { CircleCheck, CircleX, TriangleAlert, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

// ─── Types ───────────────────────────────────────────────────────────────────

export type ScheduleIconVariant = 'warning' | 'missed' | 'completed'

// ─── Mapping interne (UI only) ───────────────────────────────────────────────

const ICON_MAP: Record<ScheduleIconVariant, { icon: LucideIcon; label: string }> = {
  warning:   { icon: TriangleAlert, label: 'Cours en cours — non démarré' },
  missed:    { icon: CircleX,       label: 'Cours manqué'                 },
  completed: { icon: CircleCheck,   label: 'Cours complété'               },
}

// ─── Composant ───────────────────────────────────────────────────────────────

type Props = {
  variant: ScheduleIconVariant
  className?: string
}

export function ScheduleStatusIcon({ variant, className }: Props) {
  const { icon: Icon, label } = ICON_MAP[variant]

  return (
    <Icon
      role="img"
      aria-label={label}
      className={cn('shrink-0 size-full', className)}
    />
  )
}
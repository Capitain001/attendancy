// components/teacher/personal/ui/ScheduleStatusIcon.tsx
import { CircleCheck, CircleX, TriangleAlert, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ScheduleUiStatus } from '@/services/schedule/policy'

// ─── Types ───────────────────────────────────────────────────────────────────

export type ScheduleIcon = 'warning' | 'missed' | 'completed'

// ─── Résolution (pure) ───────────────────────────────────────────────────────

/**
 * Icône d'une séance, ou `undefined` si aucune n'est prévue
 * (PENDING, CANCELED, ONGOING démarré).
 * ONGOING sans session : la fenêtre horaire est en cours mais le cours n'a pas démarré.
 */
export function resolveScheduleIcon(
  status: ScheduleUiStatus,
  hasSession: boolean,
): ScheduleIcon | undefined {
  switch (status) {
    case 'COMPLETED':
      return 'completed'
    case 'MISSED':
      return 'missed'
    case 'ONGOING':
      return hasSession ? undefined : 'warning'
    default:
      return undefined
  }
}

// ─── Mapping interne (UI only) ───────────────────────────────────────────────

const ICON_MAP: Record<ScheduleIcon, { component: LucideIcon; label: string }> = {
  warning:   { component: TriangleAlert, label: 'Le cours devrait avoir commencé' },
  missed:    { component: CircleX,       label: 'Cours manqué'                 },
  completed: { component: CircleCheck,   label: 'Cours complété'               },
}

// ─── Composant ───────────────────────────────────────────────────────────────

type Props = {
  icon: ScheduleIcon
  className?: string
}

export function ScheduleStatusIcon({ icon, className }: Props) {
  const { component: Icon, label } = ICON_MAP[icon]

  return (
    <Icon
      role="img"
      aria-label={label}
      className={cn('shrink-0 size-full', icon === 'warning' && 'p-1', className)}
    />
  )
}
import { BookOpen, Building2, GraduationCap, LayoutGrid, Users } from 'lucide-react'
import { card, typography } from '@/styles'
import { cn } from '@/lib/utils'

type Counts = {
  courses: number
  classes: number
  rooms: number
  teachers: number
  students: number
}

const METRICS = [
  { key: 'classes',  label: 'Classes',     icon: LayoutGrid },
  { key: 'students', label: 'Étudiants',   icon: GraduationCap },
  { key: 'teachers', label: 'Enseignants', icon: Users },
  { key: 'courses',  label: 'Cours',       icon: BookOpen },
  { key: 'rooms',    label: 'Salles',      icon: Building2 },
] as const

export function OrgMetricsCard({ counts }: { counts: Counts }) {
  return (
    <>
      {METRICS.map(({ key, label, icon: Icon }) => (
        <div key={key} className={cn(card.stat, 'flex flex-col gap-2')}>
          <div className="flex items-center justify-between">
            <span className={typography.label}>{label}</span>
            <Icon className="size-4 text-text-subtle" strokeWidth={1.5} />
          </div>
          <span className={typography.metric}>{counts[key]}</span>
        </div>
      ))}
    </>
  )
}

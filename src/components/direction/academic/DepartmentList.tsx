import { Building2 } from 'lucide-react'
import { card, typography } from '@/styles'
import { cn } from '@/lib/utils'

type Department = {
  id: string
  name: string
  _count: { programTracks: number; teachers: number; ues: number }
}

export function DepartmentList({ departments }: { departments: Department[] }) {
  if (departments.length === 0) {
    return (
      <div className={cn(card.soft, 'py-12 text-center')}>
        <Building2 className="mx-auto mb-3 size-8 text-text-subtle" strokeWidth={1} />
        <p className={typography.body}>Aucun département créé.</p>
      </div>
    )
  }

  return (
    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
      {departments.map((dept) => (
        <div key={dept.id} className={cn(card.base, 'flex flex-col gap-3')}>
          <div className="flex items-center gap-2">
            <Building2 className="size-4 shrink-0 text-primary" strokeWidth={1.5} />
            <span className="text-sm font-medium text-text-primary">{dept.name}</span>
          </div>
          <div className="flex gap-4">
            <Stat label="Filières"     value={dept._count.programTracks} />
            <Stat label="Enseignants"  value={dept._count.teachers} />
            <Stat label="UEs"          value={dept._count.ues} />
          </div>
        </div>
      ))}
    </div>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-base font-semibold text-text-primary">{value}</span>
      <span className={typography.small}>{label}</span>
    </div>
  )
}

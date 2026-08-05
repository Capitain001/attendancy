'use client'
import { Building2 } from 'lucide-react'
import { CollapseSection } from '@/components/layout/CollapseSection'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { DepartmentEditButton } from '@/components/direction/academic/DepartmentForm'
import { Button } from '@/components/ui/button'
import { useDepartments } from '@/hooks/data/departments/useDepartments'
import { card, typography } from '@/styles'
import { cn } from '@/lib/utils'

type Department = {
  id: string
  name: string
  _count: { programTracks: number; teachers: number; ues: number }
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-base font-semibold text-text-primary">{value}</span>
      <span className={typography.small}>{label}</span>
    </div>
  )
}

function DepartmentRow({ dept }: { dept: Department }) {
  const { delete: remove, isDeleting } = useDepartments()
  const canDelete =
    dept._count.programTracks === 0 &&
    dept._count.teachers === 0 &&
    dept._count.ues === 0

  return (
    <div className={cn(card.base, 'flex items-center gap-4')}>
      <Building2 className="size-4 shrink-0 text-primary" strokeWidth={1.5} />

      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-text-primary">{dept.name}</p>
        <div className="mt-1.5 flex gap-4">
          <Stat label="Filières"    value={dept._count.programTracks} />
          <Stat label="Enseignants" value={dept._count.teachers} />
          <Stat label="UEs"         value={dept._count.ues} />
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1">
        <DepartmentEditButton id={dept.id} name={dept.name} />
        <ConfirmDialog
          trigger={
            <Button
              variant="ghost"
              size="sm"
              disabled={!canDelete || isDeleting}
              className="text-xs text-destructive hover:text-destructive disabled:opacity-40"
              title={!canDelete ? "Retirez les filières, enseignants et UEs d'abord  " : undefined}
            >
              Supprimer
            </Button>
          }
          title={`Supprimer "${dept.name}" ?`}
          description="Cette action est irréversible. Le département sera supprimé définitivement."
          confirmLabel="Supprimer"
          destructive
          onConfirm={() => remove(dept.id)}
        />
      </div>
    </div>
  )
}

export function DepartmentList({ initialDepartments }: { initialDepartments: Department[] }) {
  const { data: departments, isLoading } = useDepartments()
  const data = (departments as Department[] | undefined)?.length
    ? (departments as Department[])
    : initialDepartments

  return (
    <CollapseSection label="Départements" count={data.length} defaultOpen>
      {isLoading && data.length === 0 ? (
        <p className={typography.small}>Chargement…</p>
      ) : data.length === 0 ? (
        <div className="py-8 text-center">
          <Building2 className="mx-auto mb-2 size-8 text-text-subtle" strokeWidth={1} />
          <p className={typography.body}>Aucun département créé.</p>
          <p className={typography.small}>Commencez par créer le premier.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {data.map((d) => (
            <DepartmentRow key={d.id} dept={d} />
          ))}
        </div>
      )}
    </CollapseSection>
  )
}

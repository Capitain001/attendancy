'use client'
import { BookOpen } from 'lucide-react'
import { CollapseSection } from '@/components/layout/CollapseSection'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Button } from '@/components/ui/button'
import { useManageUEs } from '@/hooks/data/ue/useManageUEs'
import { card, typography } from '@/styles'
import { cn } from '@/lib/utils'

type UERow = {
  id: string
  name: string
  code: string | null
  department: { id: string; name: string } | null
  deletedAt: Date | string | null
}

function UEItem({ ue }: { ue: UERow }) {
  const { archive } = useManageUEs()

  return (
    <div className={cn(card.base, 'flex items-center gap-3')}>
      <BookOpen className="size-4 shrink-0 text-primary" strokeWidth={1.5} />

      <div className="min-w-0 flex-1 flex flex-col gap-0.5">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-text-primary">{ue.name}</span>
          {ue.code && (
            <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-mono text-text-secondary">
              {ue.code}
            </span>
          )}
        </div>
        {ue.department && (
          <span className={typography.small}>{ue.department.name}</span>
        )}
      </div>

      <ConfirmDialog
        trigger={
          <Button variant="ghost" size="sm" className="shrink-0 text-xs text-destructive hover:text-destructive">
            Archiver
          </Button>
        }
        title={`Archiver "${ue.name}" ?`}
        description="L'UE sera désactivée. L'historique est conservé."
        confirmLabel="Archiver"
        destructive
        onConfirm={() => archive.mutate(ue.id)}
      />
    </div>
  )
}

export function UEList({ initialUEs }: { initialUEs: UERow[] }) {
  const { ues, isLoading } = useManageUEs()
  const data = ues.length > 0 ? (ues as UERow[]) : initialUEs

  return (
    <CollapseSection label="Unités d'enseignement" count={data.length} defaultOpen>
      {isLoading && data.length === 0 ? (
        <p className={typography.small}>Chargement…</p>
      ) : data.length === 0 ? (
        <div className="py-8 text-center">
          <BookOpen className="mx-auto mb-2 size-8 text-text-subtle" strokeWidth={1} />
          <p className={typography.body}>Aucune UE créée.</p>
          <p className={typography.small}>Créez la première unité d&apos;enseignement.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {data.map((ue) => <UEItem key={ue.id} ue={ue} />)}
        </div>
      )}
    </CollapseSection>
  )
}

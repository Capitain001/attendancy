'use client'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { CalendarCheck, Star } from 'lucide-react'
import { CollapseSection } from '@/components/layout/CollapseSection'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Button } from '@/components/ui/button'
import { useManageAcademicYears } from '@/hooks/data/academic-year/useManageAcademicYears'
import { cn } from '@/lib/utils'
import { card, typography } from '@/styles'

type YearItem = {
  id: string
  name: string
  startDate: Date
  endDate: Date
  isCurrent: boolean
}

function YearRow({ year }: { year: YearItem }) {
  const { setCurrent, remove } = useManageAcademicYears()

  return (
    <div className={cn(card.base, 'flex items-center gap-3')}>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-text-primary">{year.name}</span>
          {year.isCurrent && (
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
              <Star className="size-2.5" />
              Courante
            </span>
          )}
        </div>
        <span className={typography.small}>
          {format(new Date(year.startDate), 'dd MMM yyyy', { locale: fr })}
          {' → '}
          {format(new Date(year.endDate), 'dd MMM yyyy', { locale: fr })}
        </span>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {!year.isCurrent && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrent.mutate(year.id)}
            disabled={setCurrent.isPending}
            className="text-xs"
          >
            Définir courante
          </Button>
        )}
        {!year.isCurrent && (
          <ConfirmDialog
            trigger={
              <Button variant="ghost" size="sm" className="text-xs text-destructive hover:text-destructive">
                Archiver
              </Button>
            }
            title={`Archiver "${year.name}" ?`}
            description="Cette année sera désactivée. Les données associées sont conservées."
            confirmLabel="Archiver"
            destructive
            onConfirm={() => remove.mutate(year.id)}
          />
        )}
      </div>
    </div>
  )
}

export function AcademicYearList({ initialYears }: { initialYears: YearItem[] }) {
  const { years, isLoading } = useManageAcademicYears()
  const data = years.length > 0 ? years : initialYears

  return (
    <CollapseSection label="Années académiques" count={data.length} defaultOpen>
      {isLoading && data.length === 0 ? (
        <p className={typography.small}>Chargement…</p>
      ) : data.length === 0 ? (
        <div className="py-8 text-center">
          <CalendarCheck className="mx-auto mb-2 size-8 text-text-subtle" strokeWidth={1} />
          <p className={typography.body}>Aucune année académique.</p>
          <p className={typography.small}>Créez la première pour commencer.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {data.map((y) => (
            <YearRow key={y.id} year={y} />
          ))}
        </div>
      )}
    </CollapseSection>
  )
}

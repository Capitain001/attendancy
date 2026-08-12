'use client'
import { BookOpen } from 'lucide-react'
import { CollapseSection } from '@/components/layout/CollapseSection'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Button } from '@/components/ui/button'
import { useManageClasses } from '@/hooks/data/class/useManageClasses'
import { typography } from '@/styles'
import Link from 'next/link'

const LEVEL_LABEL: Record<string, string> = {
  L1: 'L1', L2: 'L2', L3: 'L3',
  M1: 'M1', M2: 'M2',
  D1: 'D1', D2: 'D2', D3: 'D3',
}

type ClassRow = {
  id: string
  name: string
  level: string | null
  programTrack: { id: string; name: string }
  academicYear:  { id: string; name: string }
  _count: { studentEnrollments: number; courses: number }
}

function ClassItem({ cls }: { cls: ClassRow }) {
  const { remove } = useManageClasses()

  return (
    <tr className="border-b border-border/20 last:border-0 hover:bg-muted/20 transition-colors">
      <td className="px-4 py-3 font-medium text-text-primary"> <Link href={`./classes/${cls.id}`}>{cls.name}</Link></td>
      <td className="px-4 py-3 text-text-secondary hidden md:table-cell">{cls.programTrack.name}</td>
      <td className="px-4 py-3 text-text-secondary hidden md:table-cell">
        {cls.level ? (LEVEL_LABEL[cls.level] ?? cls.level) : '—'}
      </td>
      <td className="px-4 py-3 text-center text-text-secondary">{cls._count.studentEnrollments}</td>
      <td className="px-4 py-3 text-center text-text-secondary hidden md:table-cell">{cls._count.courses}</td>
      <td className="px-4 py-3 text-right">
        <ConfirmDialog
          trigger={
            <Button variant="ghost" size="sm" className="text-xs text-destructive hover:text-destructive">
              Archiver
            </Button>
          }
          title={`Archiver "${cls.name}" ?`}
          description="La classe sera désactivée. Les inscriptions et cours sont conservés."
          confirmLabel="Archiver"
          destructive
          onConfirm={() => remove.mutate(cls.id)}
        />
      </td>
    </tr>
  )
}

export function ClassList({ initialClasses }: { initialClasses: ClassRow[] }) {
  const { classes, isLoading } = useManageClasses()
  const data = classes.length > 0 ? (classes as ClassRow[]) : initialClasses

  return (
    <CollapseSection label="Classes" count={data.length} defaultOpen>
      {isLoading && data.length === 0 ? (
        <p className={typography.small}>Chargement…</p>
      ) : data.length === 0 ? (
        <div className="py-8 text-center">
          <BookOpen className="mx-auto mb-2 size-8 text-text-subtle" strokeWidth={1} />
          <p className={typography.body}>Aucune classe pour cette période.</p>
          <p className={typography.small}>Créez la première classe.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border/30">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/30 bg-muted/40">
                <th className="px-4 py-2 text-left font-medium text-text-subtle text-xs uppercase tracking-wide">Classe</th>
                <th className="px-4 py-2 text-left font-medium text-text-subtle text-xs uppercase tracking-wide hidden md:table-cell">Filière</th>
                <th className="px-4 py-2 text-left font-medium text-text-subtle text-xs uppercase tracking-wide hidden md:table-cell">Niveau</th>
                <th className="px-4 py-2 text-center font-medium text-text-subtle text-xs uppercase tracking-wide">Étudiants</th>
                <th className="px-4 py-2 text-center font-medium text-text-subtle text-xs uppercase tracking-wide hidden md:table-cell">Cours</th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody>
              {data.map((cls) => <ClassItem key={cls.id} cls={cls} />)}
            </tbody>
          </table>
        </div>
      )}
    </CollapseSection>
  )
}

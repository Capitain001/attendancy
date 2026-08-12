'use client'
import Link from 'next/link'
import { BookOpen } from 'lucide-react'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Button } from '@/components/ui/button'
import { useClasses } from '@/hooks/data/classes/useClasses'
import { typography } from '@/styles'
import { LEVEL_LABEL } from '@/services/class/constants'
import { Level } from '@/generated/prisma'

export type PromotionRow = {
  id: string
  name: string
  level: Level
  programTrack: { id: string; name: string }
  academicYear:  { id: string; name: string }
  _count: { studentEnrollments: number; courses: number }
}

function PromotionItem({ cls }: { cls: PromotionRow }) {
  const { delete: remove } = useClasses()

  return (
    <tr className="border-b border-border/20 last:border-0 hover:bg-muted/20 transition-colors">
      <td className="px-4 py-3 font-medium text-text-primary"> <Link href={`./promotions/${cls.id}`}>{cls.name}</Link></td>
      <td className="px-4 py-3 text-text-secondary hidden md:table-cell">{cls.programTrack.name}</td>
      <td className="px-4 py-3 text-text-secondary hidden md:table-cell">
       {LEVEL_LABEL[cls.level]}
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
          description="La promotion sera désactivée. Les inscriptions et cours sont conservés."
          confirmLabel="Archiver"
          destructive
          onConfirm={() => remove && remove(cls.id)}
        />
      </td>
    </tr>
  )
}

function SkeletonRow() {
  return (
    <tr className="border-b border-border/20 last:border-0">
      <td className="px-4 py-3"><div className="h-4 bg-muted animate-pulse rounded w-24"></div></td>
      <td className="px-4 py-3 hidden md:table-cell"><div className="h-4 bg-muted animate-pulse rounded w-32"></div></td>
      <td className="px-4 py-3 hidden md:table-cell"><div className="h-4 bg-muted animate-pulse rounded w-8"></div></td>
      <td className="px-4 py-3 text-center"><div className="h-4 bg-muted animate-pulse rounded w-8 mx-auto"></div></td>
      <td className="px-4 py-3 text-center hidden md:table-cell"><div className="h-4 bg-muted animate-pulse rounded w-8 mx-auto"></div></td>
      <td className="px-4 py-3 text-right"><div className="h-6 bg-muted animate-pulse rounded w-16 ml-auto"></div></td>
    </tr>
  )
}

interface PromotionTableProps {
  data: PromotionRow[]
  isLoading: boolean
}

export function PromotionTable({ data, isLoading }: PromotionTableProps) {
  if (!isLoading && data.length === 0) {
    return (
      <div className="py-8 text-center">
        <BookOpen className="mx-auto mb-2 size-8 text-text-subtle" strokeWidth={1} />
        <p className={typography.body}>Aucune promotion trouvée.</p>
        <p className={typography.small}>Modifiez vos filtres ou créez une promotion.</p>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border/30">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border/30 bg-muted/40">
            <th className="px-4 py-2 text-left font-medium text-text-subtle text-xs uppercase tracking-wide">Promotion</th>
            <th className="px-4 py-2 text-left font-medium text-text-subtle text-xs uppercase tracking-wide hidden md:table-cell">Filière</th>
            <th className="px-4 py-2 text-left font-medium text-text-subtle text-xs uppercase tracking-wide hidden md:table-cell">Niveau</th>
            <th className="px-4 py-2 text-center font-medium text-text-subtle text-xs uppercase tracking-wide">Étudiants</th>
            <th className="px-4 py-2 text-center font-medium text-text-subtle text-xs uppercase tracking-wide hidden md:table-cell">Cours</th>
            <th className="px-4 py-2" />
          </tr>
        </thead>
        <tbody>
          {isLoading && data.length === 0 ? (
            <>
              <SkeletonRow />
              <SkeletonRow />
              <SkeletonRow />
            </>
          ) : (
            data.map((cls) => <PromotionItem key={cls.id} cls={cls} />)
          )}
        </tbody>
      </table>
    </div>
  )
}

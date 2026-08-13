'use client'

import Link from 'next/link'
import { MoreHorizontal, BookOpen, Archive } from 'lucide-react'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useClasses } from '@/hooks/data/classes/useClasses'
import { typography } from '@/styles'
import { LEVEL_LABEL } from '@/services/class/constants'
import { GetClassesDto } from '@/services/class'

function PromotionItem({ cls }: { cls: GetClassesDto[number] }) {
  const { delete: remove } = useClasses()

  return (
    <tr className="border-b border-border/20 last:border-0 hover:bg-muted/20 transition-colors">
      <td className="px-4 py-3 font-medium text-text-primary">
        <Link href={`./promotions/${cls.id}`}>
          {cls.name}
        </Link>
      </td>

      <td className="px-4 py-3 text-text-secondary hidden md:table-cell">
        {cls.programTrack.name}
      </td>

      <td className="px-4 py-3 text-text-secondary hidden md:table-cell">
        {LEVEL_LABEL[cls.level]}
      </td>

      <td className="px-4 py-3 text-center text-text-secondary">
        {cls._count.studentEnrollments}
      </td>

      <td className="px-4 py-3 text-center text-text-secondary hidden md:table-cell">
        {cls._count.courses}
      </td>

      <td className="px-4 py-3 text-right">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              aria-label={`Options pour ${cls.name}`}
            >
              <MoreHorizontal className="size-4" />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={`./promotions/${cls.id}/program`}>
               <BookOpen className="mr-2 size-4" />
                Programme
              </Link>
            </DropdownMenuItem>

            <ConfirmDialog
              trigger={
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onSelect={(event) => event.preventDefault()}
                >
                   <Archive className="mr-2 size-4" />
                  Archiver
                </DropdownMenuItem>
              }
              title={`Archiver "${cls.name}" ?`}
              description="La promotion sera désactivée. Les inscriptions et cours sont conservés."
              confirmLabel="Archiver"
              destructive
              onConfirm={() => remove && remove(cls.id)}
            />
          </DropdownMenuContent>
        </DropdownMenu>
      </td>
    </tr>
  )
}

function SkeletonRow() {
  return (
    <tr className="border-b border-border/20 last:border-0">
      <td className="px-4 py-3">
        <div className="h-4 bg-muted animate-pulse rounded w-24" />
      </td>
      <td className="px-4 py-3 hidden md:table-cell">
        <div className="h-4 bg-muted animate-pulse rounded w-32" />
      </td>
      <td className="px-4 py-3 hidden md:table-cell">
        <div className="h-4 bg-muted animate-pulse rounded w-8" />
      </td>
      <td className="px-4 py-3 text-center">
        <div className="h-4 bg-muted animate-pulse rounded w-8 mx-auto" />
      </td>
      <td className="px-4 py-3 text-center hidden md:table-cell">
        <div className="h-4 bg-muted animate-pulse rounded w-8 mx-auto" />
      </td>
      <td className="px-4 py-3 text-right">
        <div className="h-6 bg-muted animate-pulse rounded w-8 ml-auto" />
      </td>
    </tr>
  )
}

interface PromotionTableProps {
  data: GetClassesDto
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
            <th className="px-4 py-2 text-left font-medium text-text-subtle text-xs uppercase tracking-wide">
              Promotion
            </th>
            <th className="px-4 py-2 text-left font-medium text-text-subtle text-xs uppercase tracking-wide hidden md:table-cell">
              Filière
            </th>
            <th className="px-4 py-2 text-left font-medium text-text-subtle text-xs uppercase tracking-wide hidden md:table-cell">
              Niveau
            </th>
            <th className="px-4 py-2 text-center font-medium text-text-subtle text-xs uppercase tracking-wide">
              Étudiants
            </th>
            <th className="px-4 py-2 text-center font-medium text-text-subtle text-xs uppercase tracking-wide hidden md:table-cell">
              Cours
            </th>
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
            data.map((cls) => (
              <PromotionItem key={cls.id} cls={cls} />
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { typography } from '@/styles'

type ClassItem = { id: string; name: string; programTrack: { name: string } }

interface Props {
  classes: ClassItem[]
  selectedClassId: string | null
}

export function ClassSelectorBar({ classes, selectedClassId }: Props) {
  const pathname = usePathname()

  if (classes.length === 0) return null

  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hidden">
      {classes.map((c) => (
        <Link
          key={c.id}
          href={`${pathname}?classId=${c.id}`}
          className={cn(
            'shrink-0 rounded-full border px-3 py-1 text-xs font-medium transition-colors',
            c.id === selectedClassId
              ? 'border-primary bg-primary/10 text-primary'
              : 'border-border/40 text-text-secondary hover:border-border hover:bg-muted/40',
          )}
        >
          {c.name}
        </Link>
      ))}
    </div>
  )
}

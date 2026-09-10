'use client'
import Link from 'next/link'
import { Pencil, Trash2, Settings2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { card, typography } from '@/styles'
import { cn } from '@/lib/utils'
import type { FunctionItem } from '@/services/function'

interface FunctionCardProps {
  fn: FunctionItem
  href: string
  onEdit: (fn: FunctionItem) => void
  onDelete: (fn: FunctionItem) => void
}

export function FunctionCard({ fn, href, onEdit, onDelete }: FunctionCardProps) {
  return (
    <div className={cn(card.base, 'flex items-center gap-3 py-3')}>
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
        <Settings2 className="size-4 text-primary" strokeWidth={1.5} />
      </div>

      <div className="flex-1 min-w-0">
        <Link href={href} className="text-sm font-medium text-text-primary hover:underline">
          {fn.name}
        </Link>
        {fn.description && <p className={typography.small}>{fn.description}</p>}
        <p className={typography.small}>{fn._count.users} membre{fn._count.users !== 1 ? 's' : ''}</p>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        {fn.isMain && (
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">Principale</span>
        )}
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(fn)}>
          <Pencil className="size-3.5" />
        </Button>
        {fn.isMain ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <span>
                <Button variant="ghost" size="icon" className="h-8 w-8" disabled>
                  <Trash2 className="size-3.5 text-muted-foreground" />
                </Button>
              </span>
            </TooltipTrigger>
            <TooltipContent>Fonction principale — non supprimable</TooltipContent>
          </Tooltip>
        ) : (
          <Button
            variant="ghost" size="icon"
            className="h-8 w-8 text-destructive hover:text-destructive"
            onClick={() => onDelete(fn)}
          >
            <Trash2 className="size-3.5" />
          </Button>
        )}
      </div>
    </div>
  )
}
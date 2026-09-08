'use client'
import { Settings2 } from 'lucide-react'
import { card, typography } from '@/styles'
import { cn } from '@/lib/utils'
import type { FunctionItem } from '@/services/function'
import { FunctionCard } from './FunctionCard'
import { CreateMainFunctionsButton } from './CreateMainFunctionsButton'

interface FunctionListProps {
  items: FunctionItem[]
  emptyLabel: string
  emptyHint: string
  showMainFunctionsButton?: boolean
  isChecking?: boolean
  mainFunctionsOk?: boolean | null
  /** Construit l'URL de la page détail pour une fonction donnée. */
  getHref: (fn: FunctionItem) => string
  onEdit: (fn: FunctionItem) => void
  onDelete: (id: string) => void
}

export function FunctionList({
  items,
  emptyLabel,
  emptyHint,
  showMainFunctionsButton = false,
  isChecking,
  mainFunctionsOk,
  getHref,
  onEdit,
  onDelete,
}: FunctionListProps) {
  if (items.length === 0) {
    return (
      <div className={cn(card.soft, 'py-12 text-center')}>
        <Settings2 className="mx-auto mb-3 size-8 text-text-subtle" strokeWidth={1} />
        <p className={typography.body}>{emptyLabel}</p>
        <p className={typography.small}>{emptyHint}</p>

        {showMainFunctionsButton && !isChecking && mainFunctionsOk === false && (
          <span className="flex justify-center mt-3">
            <CreateMainFunctionsButton label="Activer les fonctions principales" />
          </span>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      {items.map((fn) => (
        <FunctionCard key={fn.id} fn={fn} href={getHref(fn)} onEdit={onEdit} onDelete={onDelete} />
      ))}
    </div>
  )
}
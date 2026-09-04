'use client'

import { useState } from 'react'
import { CalendarDays, Lock, Pencil } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

type Term = {
  id: string
  name: string
  createdAt: Date
  updatedAt: Date
  startDate: Date | null
  endDate: Date | null
  order: number
  classId: string
  lockedAt: Date | null
}

interface TermsChipsProps {
  terms: Term[]
  selectedId?: string | null
  onSelect?: (id: string | null) => void
  onEdit?: (term: Term) => void
}

function formatDate(date: Date | null) {
  if (!date) return 'Non définie'

  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date))
}

export function TermsChips({
  terms,
  selectedId: controlledSelectedId,
  onSelect,
  onEdit,
}: TermsChipsProps) {
  const [internalSelectedId, setInternalSelectedId] = useState<string | null>(null)

  const selectedId = controlledSelectedId !== undefined ? controlledSelectedId : internalSelectedId
  const selectedTerm = terms.find((term) => term.id === selectedId)

  const handleToggle = (id: string) => {
    const nextId = selectedId === id ? null : id
    if (controlledSelectedId === undefined) {
      setInternalSelectedId(nextId)
    }
    onSelect?.(nextId)
  }

  return (
    <div className="space-y-2">
      <div className="relative flex flex-wrap items-center gap-1.5">
        {terms
          .slice()
          .sort((a, b) => a.order - b.order)
          .map((term) => {
            const selected = term.id === selectedId

            return (
              <button
                key={term.id}
                type="button"
                onClick={() => handleToggle(term.id)}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5',
                  'text-xs font-medium transition-colors',
                  'hover:bg-muted',
                  selected
                    ? 'border-primary/30 bg-primary/5 text-foreground'
                    : 'border-border bg-background text-muted-foreground'
                )}
              >
                {term.name}

                {term.lockedAt && (
                  <Lock className="size-3 opacity-60" />
                )}
              </button>
            )
          })}

        {selectedTerm && (
          <div className="absolute left-0 top-full z-50 mt-1 flex max-w-52 items-center gap-4 rounded-md border bg-muted/30 px-3 py-2.5 text-xs shadow-sm">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <CalendarDays className="size-3.5 shrink-0" />

              <span>
                {formatDate(selectedTerm.startDate)}
                <span className="mx-1.5 text-muted-foreground/50">
                  →
                </span>
                {formatDate(selectedTerm.endDate)}
              </span>
            </div>

            {selectedTerm.lockedAt && (
              <span className="inline-flex shrink-0 items-center gap-1 text-muted-foreground">
                <Lock className="size-3" />
                Verrouillé
              </span>
            )}

            {onEdit && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-6 shrink-0"
                onClick={() => onEdit(selectedTerm)}
              >
                <Pencil className="size-3" />
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
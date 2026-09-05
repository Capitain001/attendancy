'use client'

import { PCourseCard, type PCourse } from './PCourseCard'
import { Plus, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface ECourseCardProps {
  course: PCourse
  actionType: 'add' | 'remove'
  onAction: () => void
  isStaged?: boolean
}

export function ECourseCard({
  course,
  actionType,
  onAction,
  isStaged = false,
}: ECourseCardProps) {
  return (
    <div className="relative group">
      {/* Carte PCourseCard sous-jacente intacte */}
      <PCourseCard course={course}className={cn('bg-card/40 transition-all', isStaged && 'opacity-50 grayscale')} />

      {/* Bouton d'action (+ / -) flottant au-dessus */}
      <div className="absolute top-2 right-2 z-30">
        <button
          type="button"
          onClick={onAction}
          className={cn(
            'flex size-7 items-center justify-center rounded-full shadow-md transition-transform  cursor-pointer border border-dashed border-foreground/20 bg-foreground/90 dark:bg-background/90 hover:bg-foreground/70 dark:hover:bg-background/70',
            actionType === 'add'
              ? ' text-primary-foreground '
              : 'text-destructive-foreground'
          )}
          title={actionType === 'add' ? 'Ajouter au semestre' : 'Retirer du semestre'}
        >
          {actionType === 'add' ? (
            <Plus className="size-4" strokeWidth={2.5} />
          ) : (
            <Minus className="size-4" strokeWidth={2.5} />
          )}
        </button>
      </div>
    </div>
  )
}

'use client'

import { GridDeco } from '@/components/design/GridDeco'
import { cn } from '@/lib/utils'
import { GripHorizontal, GripVertical } from 'lucide-react'
import { memo } from 'react'
import type { CSSProperties, HTMLAttributes } from 'react'

export type PCourse = {
  id: string
  name: string
  credits: number
  ueCode?: string | null
  semesterName?: string | null
  durationDone: number
  durationTotal: number
  teacher: {
    firstName: string | null
    lastName: string | null
  } | null
}

type DragHandleProps = HTMLAttributes<HTMLDivElement> & Record<string, unknown>

export interface PCourseCardProps {
  course: PCourse
  className?: string
  dragHandleProps?: DragHandleProps
  dragRef?: (node: HTMLElement | null) => void
  style?: CSSProperties
  isDragging?: boolean
  isOverlay?: boolean
}

function getInitials(first?: string | null, last?: string | null) {
  const a = first?.[0] ?? ''
  const b = last?.[0] ?? ''
  return (a + b).toUpperCase() || '—'
}

export const PCourseCard = memo(function PCourseCard({
  course,
  className,
  dragHandleProps,
  dragRef,
  style,
  isDragging = false,
  isOverlay = false,
}: PCourseCardProps) {
  const { teacher } = course

  return (
    <div
      ref={dragRef}
      style={style}
      className={cn(
        'group relative overflow-hidden rounded-xl border border-dashed dark:border-border',
        isDragging && 'opacity-40',
        isOverlay && 'rotate-1 shadow-lg ring-2 ring-primary/40',
        className
      )}
    >
      <GridDeco />

      <div className="relative z-10 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between gap-2 border-b bg-white/95 px-3 py-2 dark:bg-white/10">

          {/* Teacher */}
          <div className="flex min-w-0 items-center gap-1.5">
            <div className="flex size-6 shrink-0 items-center justify-center rounded-full border border-dashed border-foreground/20 bg-foreground/10">
              <span className="text-[9px] font-medium">
                {getInitials(teacher?.firstName, teacher?.lastName)}
              </span>
            </div>

            <span className="truncate text-[11px] font-medium">
              {teacher
                ? `${teacher.firstName ?? ''} ${teacher.lastName ?? ''}`.trim()
                : 'Sans enseignant'}
            </span>
          </div>

          {/* DnD handle a afficher via un etat pas en permennance */}
          {dragHandleProps && (
            <div
              {...dragHandleProps}
              aria-label="Réordonner le cours"
              className={cn(
                'absolute left-1/2 -translate-x-1/2 -translate-y-[65%]  cursor-grab touch-none text-muted-foreground/40 opacity-0 transition-opacity',
                'group-hover:opacity-100 focus-visible:opacity-100',
                isDragging && 'cursor-grabbing opacity-100',
              )}
            >
              <GripHorizontal className="size-4" strokeWidth={1.8} />
            </div>
          )}

          {/* Credits */}
          <span className="shrink-0 rounded-full border border-dashed border-foreground/20 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wide text-muted-foreground">
            {course.credits} CR
          </span>
        </div>

        {/* Body */}
        <div className="bg-white/95 p-1 dark:bg-white/10">
          <div className="flex h-[92px] flex-col justify-between rounded-b-lg bg-card p-3">
            {/* Nom + code UE */}
            <div className="flex items-start justify-between gap-2">
              <p className="line-clamp-2 text-xs font-semibold leading-snug">
                {course.name}
              </p>

              {course.ueCode && (
                <span className="shrink-0 rounded-md bg-foreground/5 px-1.5 py-0.5 font-mono text-[8px] text-muted-foreground">
                  {course.ueCode}
                </span>
              )}
            </div>

            {/* Progression */}
            <div className="flex items-center justify-between gap-2">
              <span className="text-[9px] text-muted-foreground">
                Progression
              </span>

              <span className="text-[9px] font-medium text-muted-foreground">
                {course.durationTotal > 0
                  ? `${course.durationDone}h / ${course.durationTotal}h`
                  : 'Non planifié'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
})


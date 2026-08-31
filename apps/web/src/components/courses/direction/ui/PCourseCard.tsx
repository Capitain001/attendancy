'use client'

import { GridDeco } from '@/components/design/GridDeco'

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

function getInitials(first?: string | null, last?: string | null) {
  const a = first?.[0] ?? ''
  const b = last?.[0] ?? ''
  return (a + b).toUpperCase() || '—'
}

export function PCourseCard({ course }: { course: PCourse }) {
  const { teacher } = course

  return (
    <div className="relative overflow-hidden rounded-xl border border-dashed dark:border-border">
      <GridDeco />

      <div className="relative z-10 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between gap-2 border-b bg-white/95 px-3 py-2 dark:bg-white/10">
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
}
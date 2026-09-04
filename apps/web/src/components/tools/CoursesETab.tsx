// src/components/tools/CoursesETab.tsx
'use client'

import { useState } from 'react'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import { Save, X, Layers, LayoutGrid } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ECourseCard } from '@/components/courses/direction/ui/ECourseCard'
import type { PCourse } from '@/components/courses/direction/ui/PCourseCard'

export type ETermGroup = {
  id: string
  name: string
}

interface CoursesETabProps {
  activeTerm: ETermGroup | null
  courses: (PCourse & { termId?: string | null })[]
  pendingChanges: Map<string, string | null>
  isSubmitting?: boolean
  onToggleCourse: (courseId: string, originalTermId: string | null, targetTermId: string | null) => void
  onSave?: () => Promise<void>
  onReset?: () => void
  onCancel?: () => void
}

export function CoursesETab({
  activeTerm,
  courses,
  pendingChanges,
  isSubmitting = false,
  onToggleCourse,
  onSave,
  onReset,
  onCancel,
}: CoursesETabProps) {
  const [subTab, setSubTab] = useState<'current' | 'others'>('current')

  const activeTermId = activeTerm?.id ?? null
  const activeTermName = activeTerm?.name ?? 'Ce semestre'

  // Determine effective termId considering staged changes
  const getEffectiveTermId = (course: PCourse & { termId?: string | null }) => {
    if (pendingChanges.has(course.id)) {
      return pendingChanges.get(course.id)
    }
    return course.termId ?? null
  }

  const hasPending = pendingChanges.size > 0

  const currentSemesterCourses = courses.filter((c) => getEffectiveTermId(c) === activeTermId)
  const otherCourses = courses.filter((c) => getEffectiveTermId(c) !== activeTermId)

  return (
    <div className="w-full flex flex-col gap-3">
      {/* Barre d'action d'édition supérieure */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-dashed border-primary/30 bg-primary/5 p-3">
        <div className="flex items-center gap-2">
          <span className="flex size-2 rounded-full bg-primary animate-pulse" />
          <span className="text-xs font-medium text-foreground">
            Mode édition — <span className="font-semibold text-primary">{activeTermName}</span>
          </span>
          {hasPending && (
            <span className="rounded-full bg-primary/10 px-2 py-0.5 font-mono text-[10px] font-semibold text-primary">
              {pendingChanges.size} modification(s) en attente
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {hasPending && onReset && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onReset}
              disabled={isSubmitting}
              className="h-8 gap-1 text-xs"
            >
              <X className="size-3.5" />
              Réinitialiser
            </Button>
          )}

          {onCancel && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onCancel}
              disabled={isSubmitting}
              className="h-8 text-xs"
            >
              Quitter
            </Button>
          )}

          {onSave && (
            <Button
              type="button"
              size="sm"
              onClick={onSave}
              disabled={!hasPending || isSubmitting}
              className="h-8 gap-1.5 text-xs"
            >
              <Save className="size-3.5" />
              {isSubmitting ? "Enregistrement..." : "Enregistrer"}
            </Button>
          )}
        </div>
      </div>

      {/* Onglets uniquement pour Dans ce semestre vs Autres cours */}
      <Tabs value={subTab} onValueChange={(val) => setSubTab(val as 'current' | 'others')} className="w-full flex flex-col gap-0 ">
        <TabsList className="h-auto w-52 justify-start gap-1 rounded-none border-0 bg-transparent p-0">
          <TabsTrigger
            value="current"
            className={cn(
              'group relative z-10 -mb-px flex translate-y-0.5 items-center gap-1.5 rounded-t-xl rounded-b-none border border-dashed border-transparent bg-foreground/[0.04] px-3.5 py-2 text-muted-foreground shadow-none transition-all',
              'hover:bg-foreground/[0.07] hover:text-foreground',
              'data-[state=active]:translate-y-0 data-[state=active]:border-foreground/20 data-[state=active]:border-b-0 data-[state=active]:bg-card data-[state=active]:text-foreground'
            )}
          >
            <LayoutGrid className="size-3.5" />
            <span className="font-mono text-[10px] uppercase tracking-wide">
              Dans ce semestre ({currentSemesterCourses.length})
            </span>
          </TabsTrigger>

          <TabsTrigger
            value="others"
            className={cn(
              'group relative z-10 -mb-px flex translate-y-0.5 items-center gap-1.5 rounded-t-xl rounded-b-none border border-dashed border-transparent bg-foreground/[0.04] px-3.5 py-2 text-muted-foreground shadow-none transition-all',
              'hover:bg-foreground/[0.07] hover:text-foreground',
              'data-[state=active]:translate-y-0 data-[state=active]:border-foreground/20 data-[state=active]:border-b-0 data-[state=active]:bg-card data-[state=active]:text-foreground'
            )}
          >
            <Layers className="size-3.5" />
            <span className="font-mono text-[10px] uppercase tracking-wide">
              Autres cours ({otherCourses.length})
            </span>
          </TabsTrigger>
        </TabsList>

        <TabsContent
          value="current"
          className="m-0 rounded-b-xl rounded-t-none rounded-tl-lg border border-dashed border-foreground/20 bg-card p-4 dark:border-border space-y-4"
        >
          {currentSemesterCourses.length === 0 ? (
            <p className="py-8 text-center text-xs text-muted-foreground">
              Aucun cours attribué à ce semestre. Passez sur "Autres cours" pour en ajouter.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {currentSemesterCourses.map((c) => (
                <ECourseCard
                  key={c.id}
                  course={c}
                  actionType="remove"
                  onAction={() => onToggleCourse(c.id, c.termId ?? null, null)}
                  isStaged={pendingChanges.has(c.id)}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent
          value="others"
          className="m-0 rounded-b-xl rounded-t-none rounded-tr-lg border border-dashed border-foreground/20 bg-card p-4 dark:border-border space-y-4"
        >
          {otherCourses.length === 0 ? (
            <p className="py-8 text-center text-xs text-muted-foreground">
              Tous les cours de la promotion sont déjà affectés à ce semestre.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {otherCourses.map((c) => (
                <ECourseCard
                  key={c.id}
                  course={c}
                  actionType="add"
                  onAction={() => onToggleCourse(c.id, c.termId ?? null, activeTermId)}
                  isStaged={pendingChanges.has(c.id)}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

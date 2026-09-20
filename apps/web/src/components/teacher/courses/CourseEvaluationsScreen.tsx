'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { ArrowLeft, Award, Calendar, ChevronRight, FileText, CheckCircle2 } from 'lucide-react'
import type { GetCourseDetailDto } from '@/services/course/generated.types'
import type { GetCourseEvaluationsDto } from '@/services/evaluation/generated.types'
import type { EvaluationType } from '@/generated/prisma/client'
import { EVALUATION_TYPES } from '@/services/evaluation/constants'
import { GhostEmptyEvaluations } from './ui/GhostEmptyEvaluations'
import { CreateEvaluationDialog } from './ui/CreateEvaluationDialog'
import { EvaluationDetailSheet } from './ui/EvaluationDetailSheet'

type CourseDetailDto = NonNullable<GetCourseDetailDto>
type EvaluationItem = NonNullable<GetCourseEvaluationsDto>[number]

interface CourseEvaluationsScreenProps {
  slug: string
  course: CourseDetailDto
  evaluations: EvaluationItem[]
}

const EVALUATION_TYPE_CONFIG: Record<
  EvaluationType,
  { label: string; dot: string; bg: string; text: string }
> = {
  DEVOIR: {
    label: 'Devoir',
    dot: 'bg-blue-500/70',
    bg: 'bg-blue-500/10',
    text: 'text-blue-500',
  },
  EXAMEN: {
    label: 'Examen',
    dot: 'bg-purple-500/70',
    bg: 'bg-purple-500/10',
    text: 'text-purple-500',
  },
  PROJET: {
    label: 'Projet',
    dot: 'bg-amber-500/70',
    bg: 'bg-amber-500/10',
    text: 'text-amber-500',
  },
  PARTICIPATION: {
    label: 'Participation',
    dot: 'bg-emerald-500/70',
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-500',
  },
}

function formatEvaluationDate(date: Date | string) {
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date))
}

export function CourseEvaluationsScreen({
  slug: _slug,
  course,
  evaluations,
}: CourseEvaluationsScreenProps) {
  const [selectedType, setSelectedType] = useState<string>('ALL')
  const [activeEvaluationId, setActiveEvaluationId] = useState<string | null>(null)

  const filteredEvaluations = useMemo(() => {
    if (selectedType === 'ALL') return evaluations
    return evaluations.filter((e) => e.type === selectedType)
  }, [evaluations, selectedType])

  const totalCoeff = evaluations.reduce((acc, e) => acc + e.coefficient, 0)
  const totalGradedCount = evaluations.reduce(
    (acc, e) => acc + e.grades.filter((g) => g.status === 'GRADED').length,
    0,
  )
  const totalExpectedGrades = evaluations.reduce((acc, e) => acc + e._count.grades, 0)

  return (
    <div className="flex flex-col gap-6 pb-20">
      {/* Navigation retour */}
      <Link
        href={"./"}
        className="inline-flex w-fit items-center gap-1 text-xs text-foreground/40 transition-colors hover:text-foreground/70"
      >
        <ArrowLeft className="size-3" />
        <span>{course.name}</span>
      </Link>

      {/* En-tête avec bouton d'ajout */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight">Évaluations</h1>
          <p className="text-sm text-foreground/40">
            {course.name} · {course.class.name}
          </p>
        </div>
        <CreateEvaluationDialog courseId={course.id} courseName={course.name} />
      </div>

      {/* Statistiques rapides */}
      <div className="grid grid-cols-3 gap-2">
        <div className="flex flex-col gap-0.5 rounded-xl bg-foreground/5 p-3">
          <span className="flex items-center gap-1.5 text-[11px] text-foreground/40">
            <Award className="size-3.5" />
            Évaluations
          </span>
          <span className="font-mono text-base font-semibold tabular-nums text-foreground/80 sm:text-lg">
            {evaluations.length}
          </span>
        </div>

        <div className="flex flex-col gap-0.5 rounded-xl bg-foreground/5 p-3">
          <span className="flex items-center gap-1.5 text-[11px] text-foreground/40">
            <FileText className="size-3.5" />
            Coeff. total
          </span>
          <span className="font-mono text-base font-semibold tabular-nums text-foreground/80 sm:text-lg">
            {totalCoeff}
          </span>
        </div>

        <div className="flex flex-col gap-0.5 rounded-xl bg-foreground/5 p-3">
          <span className="flex items-center gap-1.5 text-[11px] text-foreground/40">
            <CheckCircle2 className="size-3.5" />
            Notes saisies
          </span>
          <span className="font-mono text-base font-semibold tabular-nums text-foreground/80 sm:text-lg">
            {totalExpectedGrades > 0
              ? `${totalGradedCount}/${totalExpectedGrades}`
              : totalGradedCount > 0
                ? totalGradedCount
                : '0'}
          </span>
        </div>
      </div>

      {/* Filtres types (Mobile First Chips) */}
      {evaluations.length > 0 && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <button
            type="button"
            onClick={() => setSelectedType('ALL')}
            className={`shrink-0 rounded-lg px-2.5 py-1 font-medium transition-colors ${
              selectedType === 'ALL'
                ? 'bg-foreground text-background shadow-sm'
                : 'bg-foreground/5 text-foreground/60 hover:bg-foreground/10'
            }`}
          >
            Tous ({evaluations.length})
          </button>
          {EVALUATION_TYPES.map((t) => {
            const count = evaluations.filter((e) => e.type === t).length
            if (count === 0) return null
            const isSelected = selectedType === t
            return (
              <button
                key={t}
                type="button"
                onClick={() => setSelectedType(t)}
                className={`shrink-0 rounded-lg px-2.5 py-1 font-medium transition-colors ${
                  isSelected
                    ? 'bg-foreground text-background shadow-sm'
                    : 'bg-foreground/5 text-foreground/60 hover:bg-foreground/10'
                }`}
              >
                {EVALUATION_TYPE_CONFIG[t].label} ({count})
              </button>
            )
          })}
        </div>
      )}

      {/* Liste des évaluations ou Ghost Empty State */}
      <div className="flex flex-col gap-2">
        {evaluations.length === 0 ? (
          <GhostEmptyEvaluations />
        ) : filteredEvaluations.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-foreground/15 py-12 text-center">
            <p className="text-sm font-medium text-foreground/60">
              Aucune évaluation pour ce filtre
            </p>
            <button
              type="button"
              onClick={() => setSelectedType('ALL')}
              className="text-xs text-foreground/40 underline hover:text-foreground/70"
            >
              Afficher toutes les évaluations
            </button>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-foreground/10">
            <div className="p-1">
              {filteredEvaluations.map((evaluation, index, arr) => {
                const typeConfig = EVALUATION_TYPE_CONFIG[evaluation.type]
                const gradedCount = evaluation.grades.filter(
                  (g) => g.status === 'GRADED',
                ).length
                const totalGraded = evaluation._count.grades

                return (
                  <div
                    key={evaluation.id}
                    onClick={() => setActiveEvaluationId(evaluation.id)}
                    className={`group/row flex cursor-pointer flex-col gap-2.5 p-3.5 transition-colors bg-foreground/[0.02] sm:rounded-lg sm:bg-transparent sm:hover:bg-foreground/5 ${
                      index !== arr.length - 1
                        ? 'border-b border-foreground/[0.06] sm:border-b-0'
                        : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`size-2 shrink-0 rounded-full ${typeConfig?.dot ?? 'bg-foreground/30'}`}
                        aria-hidden="true"
                      />
                      <div className="flex min-w-0 flex-1 items-center justify-between gap-2">
                        <span className="truncate font-medium text-foreground/80 group-hover/row:text-foreground">
                          {evaluation.title}
                        </span>
                        <div className="flex shrink-0 items-center gap-2">
                          <span className="font-mono text-xs tabular-nums text-foreground/40">
                            Coef. {evaluation.coefficient} · /{evaluation.maxScore}
                          </span>
                          <ChevronRight className="size-3.5 text-foreground/20 transition-transform group-hover/row:translate-x-0.5" />
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pl-5 text-xs text-foreground/40">
                      <span className="flex items-center gap-1.5 font-mono text-[11px]">
                        <Calendar className="size-3" />
                        {formatEvaluationDate(evaluation.datedAt)}
                      </span>
                      <span className="font-mono text-[11px]">
                        {totalGraded > 0
                          ? `${gradedCount}/${totalGraded} noté(s)`
                          : gradedCount > 0
                            ? `${gradedCount} noté(s)`
                            : '0 note'}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Drawer / Sheet de notation & détail */}
      <EvaluationDetailSheet
        evaluationId={activeEvaluationId}
        onClose={() => setActiveEvaluationId(null)}
      />
    </div>
  )
}

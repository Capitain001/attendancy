'use client'

import { useState, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  X,
  Trash2,
  Save,
  Loader2,
  Calendar,
  Award,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  getEvaluationDetailAction,
  upsertGradesAction,
  deleteEvaluationAction,
} from '@/services/evaluation/actions'
import type { GetEvaluationDetailDto } from '@/services/evaluation/generated.types'
import type { GradeStatus } from '@/generated/prisma/client'

type EvaluationDetail = NonNullable<GetEvaluationDetailDto>

interface EvaluationDetailSheetProps {
  evaluationId: string | null
  onClose: () => void
}

interface StudentGradeState {
  enrollmentId: string
  studentName: string
  studentEmail: string
  status: GradeStatus
  score: string
  comment: string
}

export function EvaluationDetailSheet({
  evaluationId,
  onClose,
}: EvaluationDetailSheetProps) {
  const router = useRouter()
  const [detail, setDetail] = useState<EvaluationDetail | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [isDeleting, setIsDeleting] = useState(false)
  const [gradesState, setGradesState] = useState<StudentGradeState[]>([])

  useEffect(() => {
    if (!evaluationId) {
      setDetail(null)
      setGradesState([])
      return
    }

    let active = true
    setIsLoading(true)

    getEvaluationDetailAction(evaluationId).then((res) => {
      if (!active) return
      setIsLoading(false)

      if ('error' in res || !res.data) {
        toast.error('Impossible de charger les détails de l’évaluation')
        onClose()
        return
      }

      const evalData = res.data
      setDetail(evalData)

      // Initialiser la grille des notes pour tous les étudiants inscrits
      const enrollments = evalData.course?.class?.studentEnrollments ?? []
      const existingGradesMap = new Map(
        evalData.grades.map((g) => [g.enrollmentId, g]),
      )

      const initial: StudentGradeState[] = enrollments.map((enr) => {
        const existing = existingGradesMap.get(enr.id)
        const name =
          `${enr.student.user.firstName} ${enr.student.user.lastName}`.trim()
        return {
          enrollmentId: enr.id,
          studentName: name || 'Étudiant',
          studentEmail: enr.student.user.email,
          status: existing?.status ?? 'PENDING',
          score: existing?.score !== null && existing?.score !== undefined ? String(existing.score) : '',
          comment: existing?.comment ?? '',
        }
      })

      setGradesState(initial)
    })

    return () => {
      active = false
    }
  }, [evaluationId, onClose])

  const handleScoreChange = (enrollmentId: string, val: string) => {
    setGradesState((prev) =>
      prev.map((g) => {
        if (g.enrollmentId !== enrollmentId) return g
        const status = val.trim() === '' ? 'PENDING' : 'GRADED'
        return { ...g, score: val, status }
      }),
    )
  }

  const handleStatusToggle = (enrollmentId: string, status: GradeStatus) => {
    setGradesState((prev) =>
      prev.map((g) => {
        if (g.enrollmentId !== enrollmentId) return g
        return {
          ...g,
          status,
          score: status === 'GRADED' ? g.score : '',
        }
      }),
    )
  }

  const handleSaveGrades = () => {
    if (!evaluationId || !detail) return

    startTransition(async () => {
      const gradesToSubmit = gradesState.map((g) => {
        const numScore = g.score.trim() === '' ? null : parseFloat(g.score)
        return {
          enrollmentId: g.enrollmentId,
          status: g.status,
          score: numScore,
          comment: g.comment.trim() || null,
        }
      })

      const res = await upsertGradesAction({
        evaluationId,
        data: {
          grades: gradesToSubmit,
        },
      })

      if ('error' in res) {
        toast.error(res.error)
        return
      }

      toast.success('Notes enregistrées avec succès')
      router.refresh()
      onClose()
    })
  }

  const handleDelete = async () => {
    if (!evaluationId) return
    if (!confirm('Voulez-vous vraiment supprimer cette évaluation ?')) return

    setIsDeleting(true)
    const res = await deleteEvaluationAction(evaluationId)
    setIsDeleting(false)

    if ('error' in res) {
      toast.error(res.error)
      return
    }

    toast.success('Évaluation supprimée')
    router.refresh()
    onClose()
  }

  // Calculs statistiques en direct
  const gradedList = gradesState.filter(
    (g) => g.status === 'GRADED' && g.score !== '',
  )
  const averageScore =
    gradedList.length > 0
      ? (
          gradedList.reduce((acc, g) => acc + (parseFloat(g.score) || 0), 0) /
          gradedList.length
        ).toFixed(1)
      : null

  const open = Boolean(evaluationId)

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-xl overflow-hidden border-foreground/15 p-0 sm:rounded-2xl">
        {isLoading || !detail ? (
          <div className="flex h-64 flex-col items-center justify-center gap-2">
            <Loader2 className="size-6 animate-spin text-foreground/40" />
            <p className="text-xs text-foreground/40">Chargement des notes...</p>
          </div>
        ) : (
          <div className="flex max-h-[90vh] flex-col">
            {/* Header */}
            <div className="border-b border-foreground/10 p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex flex-col gap-1">
                  <DialogHeader className="gap-0.5 text-left">
                    <DialogTitle className="text-lg font-bold tracking-tight">
                      {detail.title}
                    </DialogTitle>
                    <p className="text-xs text-foreground/40">
                      {detail.course?.name} · Coef. {detail.coefficient} · Barème /{detail.maxScore}
                    </p>
                  </DialogHeader>
                </div>
              </div>

              {/* Mini Stats Live */}
              <div className="mt-4 grid grid-cols-3 gap-2">
                <div className="flex flex-col rounded-lg bg-foreground/5 p-2.5">
                  <span className="text-[11px] text-foreground/40">Saisie</span>
                  <span className="font-mono text-sm font-semibold tabular-nums text-foreground/80">
                    {gradedList.length} / {gradesState.length}
                  </span>
                </div>
                <div className="flex flex-col rounded-lg bg-foreground/5 p-2.5">
                  <span className="text-[11px] text-foreground/40">Moyenne</span>
                  <span className="font-mono text-sm font-semibold tabular-nums text-foreground/80">
                    {averageScore !== null ? `${averageScore}/${detail.maxScore}` : '—'}
                  </span>
                </div>
                <div className="flex flex-col rounded-lg bg-foreground/5 p-2.5">
                  <span className="text-[11px] text-foreground/40">Absents</span>
                  <span className="font-mono text-sm font-semibold tabular-nums text-foreground/80">
                    {gradesState.filter((g) => g.status === 'ABSENT').length}
                  </span>
                </div>
              </div>
            </div>

            {/* Liste des étudiants (Scrollable) */}
            <div className="flex-1 overflow-y-auto p-4">
              {gradesState.length === 0 ? (
                <div className="py-12 text-center text-xs text-foreground/40">
                  Aucun étudiant inscrit dans cette classe.
                </div>
              ) : (
                <div className="flex flex-col divide-y divide-foreground/5">
                  {gradesState.map((student) => (
                    <div
                      key={student.enrollmentId}
                      className="flex items-center justify-between gap-3 py-3"
                    >
                      <div className="flex min-w-0 flex-1 flex-col">
                        <span className="truncate text-sm font-medium text-foreground/80">
                          {student.studentName}
                        </span>
                        <span className="truncate text-xs text-foreground/30">
                          {student.studentEmail}
                        </span>
                      </div>

                      {/* Statuts rapides */}
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() =>
                            handleStatusToggle(
                              student.enrollmentId,
                              student.status === 'ABSENT' ? 'PENDING' : 'ABSENT',
                            )
                          }
                          className={`rounded px-1.5 py-1 text-[10px] font-mono transition-colors ${
                            student.status === 'ABSENT'
                              ? 'bg-amber-500/20 text-amber-500 font-semibold'
                              : 'bg-foreground/5 text-foreground/40 hover:bg-foreground/10'
                          }`}
                        >
                          ABS
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            handleStatusToggle(
                              student.enrollmentId,
                              student.status === 'EXCUSED' ? 'PENDING' : 'EXCUSED',
                            )
                          }
                          className={`rounded px-1.5 py-1 text-[10px] font-mono transition-colors ${
                            student.status === 'EXCUSED'
                              ? 'bg-purple-500/20 text-purple-500 font-semibold'
                              : 'bg-foreground/5 text-foreground/40 hover:bg-foreground/10'
                          }`}
                        >
                          EXC
                        </button>

                        {/* Note Input */}
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            min="0"
                            max={detail.maxScore}
                            step="0.25"
                            placeholder="—"
                            disabled={student.status === 'ABSENT' || student.status === 'EXCUSED'}
                            value={student.score}
                            onChange={(e) =>
                              handleScoreChange(student.enrollmentId, e.target.value)
                            }
                            className="h-8 w-14 rounded-md border border-foreground/15 bg-background px-2 text-center font-mono text-xs tabular-nums text-foreground focus:border-foreground/30 focus:outline-none disabled:opacity-30"
                          />
                          <span className="font-mono text-xs text-foreground/30">
                            /{detail.maxScore}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="flex items-center justify-between border-t border-foreground/10 bg-foreground/[0.02] p-4">
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting || isPending}
                className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs text-rose-500/80 transition-colors hover:bg-rose-500/10 hover:text-rose-500 disabled:opacity-50"
              >
                {isDeleting ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Trash2 className="size-3.5" />
                )}
                <span>Supprimer</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-lg px-3 py-1.5 text-xs font-medium text-foreground/60 transition-colors hover:text-foreground"
                >
                  Fermer
                </button>
                <button
                  type="button"
                  onClick={handleSaveGrades}
                  disabled={isPending || isDeleting}
                  className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-foreground px-4 text-xs font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-50"
                >
                  {isPending ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Save className="size-3.5" />
                  )}
                  <span>Enregistrer</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

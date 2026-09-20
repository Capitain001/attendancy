'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from '@/components/ui/dialog'
import { createEvaluationAction } from '@/services/evaluation/actions'
import { EVALUATION_TYPES } from '@/services/evaluation/constants'
import type { EvaluationType } from '@/generated/prisma/client'

const TYPE_CONFIG: Record<EvaluationType, { label: string }> = {
  DEVOIR: { label: 'Devoir' },
  EXAMEN: { label: 'Examen' },
  PROJET: { label: 'Projet' },
  PARTICIPATION: { label: 'Participation' },
}

interface CreateEvaluationDialogProps {
  courseId: string
  courseName: string
}

export function CreateEvaluationDialog({
  courseId,
  courseName,
}: CreateEvaluationDialogProps) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const [title, setTitle] = useState('')
  const [type, setType] = useState<EvaluationType>('DEVOIR')
  const [coefficient, setCoefficient] = useState('1')
  const [maxScore, setMaxScore] = useState('20')
  const [datedAt, setDatedAt] = useState(
    new Date().toISOString().split('T')[0] ?? '',
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) {
      toast.error('Veuillez saisir un titre')
      return
    }

    startTransition(async () => {
      const res = await createEvaluationAction({
        courseId,
        title: title.trim(),
        type,
        coefficient: parseFloat(coefficient) || 1,
        maxScore: parseFloat(maxScore) || 20,
        datedAt: new Date(datedAt),
      })

      if ('error' in res) {
        toast.error(res.error)
        return
      }

      toast.success('Évaluation créée avec succès')
      setOpen(false)
      setTitle('')
      setCoefficient('1')
      setMaxScore('20')
      router.refresh()
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 rounded-lg bg-foreground/10 px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-foreground/15 active:scale-[0.98]"
        >
          <Plus className="size-3.5" />
          <span>Nouvelle évaluation</span>
        </button>
      </DialogTrigger>

      <DialogContent className="max-w-md border-foreground/15 p-5 sm:rounded-2xl">
        <DialogHeader className="gap-1 text-left">
          <DialogTitle className="text-lg font-semibold tracking-tight">
            Nouvelle évaluation
          </DialogTitle>
          <DialogDescription className="text-xs text-foreground/40">
            {courseName} · Définissez l&apos;intitulé et le barème.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-2 flex flex-col gap-4">
          {/* Type Selector (Segmented control mobile-first) */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-foreground/50">Type</label>
            <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
              {EVALUATION_TYPES.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={`rounded-lg py-2 text-xs font-medium transition-all ${
                    type === t
                      ? 'bg-foreground text-background shadow-sm'
                      : 'bg-foreground/5 text-foreground/60 hover:bg-foreground/10'
                  }`}
                >
                  {TYPE_CONFIG[t].label}
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="eval-title" className="text-xs text-foreground/50">
              Titre / Intitulé
            </label>
            <input
              id="eval-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="ex. Devoir sur table N°1"
              required
              className="h-10 rounded-lg border border-foreground/15 bg-background px-3 text-sm text-foreground placeholder:text-foreground/30 focus:border-foreground/30 focus:outline-none"
            />
          </div>

          {/* Coeff & Barème */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="eval-coeff" className="text-xs text-foreground/50">
                Coefficient
              </label>
              <input
                id="eval-coeff"
                type="number"
                step="0.1"
                min="0.1"
                value={coefficient}
                onChange={(e) => setCoefficient(e.target.value)}
                className="h-10 rounded-lg border border-foreground/15 bg-background px-3 font-mono text-sm text-foreground focus:border-foreground/30 focus:outline-none"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="eval-max" className="text-xs text-foreground/50">
                Barème (sur)
              </label>
              <input
                id="eval-max"
                type="number"
                step="1"
                min="1"
                value={maxScore}
                onChange={(e) => setMaxScore(e.target.value)}
                className="h-10 rounded-lg border border-foreground/15 bg-background px-3 font-mono text-sm text-foreground focus:border-foreground/30 focus:outline-none"
              />
            </div>
          </div>

          {/* Date */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="eval-date" className="text-xs text-foreground/50">
              Date de l&apos;évaluation
            </label>
            <input
              id="eval-date"
              type="date"
              value={datedAt}
              onChange={(e) => setDatedAt(e.target.value)}
              required
              className="h-10 rounded-lg border border-foreground/15 bg-background px-3 text-sm text-foreground focus:border-foreground/30 focus:outline-none"
            />
          </div>

          {/* Submit */}
          <div className="mt-2 flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-lg px-3 py-2 text-xs font-medium text-foreground/60 transition-colors hover:text-foreground"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isPending || !title.trim()}
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-foreground px-4 text-xs font-medium text-background transition-opacity disabled:opacity-50"
            >
              {isPending && <Loader2 className="size-3 animate-spin" />}
              <span>Créer l&apos;évaluation</span>
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

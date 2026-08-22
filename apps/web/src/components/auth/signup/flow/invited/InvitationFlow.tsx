'use client'

import { memo, useCallback, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { ArrowLeft } from 'lucide-react'
import { isRedirectError } from 'next/dist/client/components/redirect-error'

import type { ConfirmStatus } from './InvitationSteps'
import type { AuthActionResult } from '@/modules/auth/types'
import { button, card, layout } from '@/styles'
import { cn } from '@/lib/utils'

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1]

const CONTENT_INITIAL = { opacity: 0, y: 10 }
const CONTENT_ANIMATE = { opacity: 1, y: 0 }
const CONTENT_EXIT    = { opacity: 0, y: -10 }
const CONTENT_TRANSITION = { duration: 0.25, ease: EASE }

const DOT_TRANSITION = { duration: 0.3, ease: EASE }


// ─── Types publics ───────────────────────────────────────────────────────────

export interface StepDef {
  key: string
  render: () => React.ReactNode
}

export interface ConfirmDef {
  key: string
  render: (status: ConfirmStatus) => React.ReactNode
}

export interface InvitationFlowProps {
  steps: StepDef[]
  confirm: ConfirmDef
  onAccept?: () => AuthActionResult | Promise<AuthActionResult>
  onDecline?: () => AuthActionResult | Promise<AuthActionResult>
  /** Affiché après un accept réussi qui ne redirige pas (ex: NEW user → signup). */
  onContinue?: () => void
}


// ─── Composant ───────────────────────────────────────────────────────────────

export default function InvitationFlow({
  steps,
  confirm,
  onAccept,
  onDecline,
  onContinue,
}: InvitationFlowProps) {
  const [stepIndex, setStepIndex] = useState(0)
  const [status, setStatus] = useState<ConfirmStatus>('idle')
  const [error, setError] = useState<string | null>(null)

  const totalSteps = steps.length + 1
  const isConfirmStep = stepIndex === steps.length
  const isAccepted = status === 'accepted'
  const isBusy = status === 'accepting' || status === 'declining'

  const next = useCallback(
    () => setStepIndex((i) => Math.min(i + 1, totalSteps - 1)),
    [totalSteps]
  )

  const back = useCallback(
    () => setStepIndex((i) => Math.max(i - 1, 0)),
    []
  )

  const handleAccept = useCallback(async () => {
    setStatus('accepting')
    setError(null)
    try {
      const result = await onAccept?.()
      // Si onAccept redirige côté serveur (user existant, succès), le throw
      // NEXT_REDIRECT ci-dessous interrompt avant d'atteindre cette ligne.
      // On arrive ici uniquement si l'action est retournée sans redirect —
      // càd un échec métier explicite (result.error), pas un throw.
      if (result?.error) {
        setError(result.error)
        setStatus('idle')
        return
      }
      setStatus('accepted')
    } catch (err) {
      if (isRedirectError(err)) throw err // laisser Next gérer la navigation
      setStatus('idle')
    }
  }, [onAccept])

  const handleDecline = useCallback(async () => {
    setStatus('declining')
    setError(null)
    try {
      const result = await onDecline?.()
      if (result?.error) {
        setError(result.error)
      }
    } catch (err) {
      if (isRedirectError(err)) throw err
    } finally {
      setStatus('idle')
    }
  }, [onDecline])

  const activeKey = isAccepted ? 'accepted' : isConfirmStep ? confirm.key : steps[stepIndex].key

  return (
    <div className={cn(layout.centerCol, 'min-h-screen px-[5vw]')}>
      <div className="w-full max-w-[26em]">

        {!isAccepted && (
          <ProgressDots current={stepIndex} total={totalSteps} />
        )}

        <div className={cn(card.lexical, layout.stack, 'relative p-[2.5em] text-center')}>

          {isConfirmStep && !isAccepted && (
            <button
              onClick={back}
              disabled={isBusy}
              className="absolute left-4 top-4"
              aria-label="Retour"
            >
              <ArrowLeft className="size-5" />
            </button>
          )}

          <AnimatePresence mode="wait">
            <motion.div
              key={activeKey}
              className="flex w-full flex-col items-center gap-4"
              initial={CONTENT_INITIAL}
              animate={CONTENT_ANIMATE}
              exit={CONTENT_EXIT}
              transition={CONTENT_TRANSITION}
            >
              {isConfirmStep
                ? confirm.render(status)
                : steps[stepIndex].render()}
            </motion.div>
          </AnimatePresence>

          {error && isConfirmStep && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}

          {!isConfirmStep && (
            <div className="flex w-full gap-2">
              {stepIndex > 0 && (
                <button onClick={back} className={cn(button.ghost, 'flex-1')}>
                  Retour
                </button>
              )}
              <button
                onClick={next}
                className={cn(button.primary, stepIndex === 0 ? button.fullWidth : 'flex-1')}
              >
                Continuer
              </button>
            </div>
          )}

          {isConfirmStep && !isAccepted && (
            <div className="flex w-full gap-2">
              <button
                onClick={handleDecline}
                disabled={isBusy}
                className={cn(button.secondary, 'flex-1')}
              >
                {status === 'declining' ? 'Refus…' : 'Refuser'}
              </button>
              <button
                onClick={handleAccept}
                disabled={isBusy}
                className={cn(button.primary, 'flex-1')}
              >
                {status === 'accepting' ? 'Validation…' : 'Rejoindre'}
              </button>
            </div>
          )}

          {isAccepted && onContinue && (
            <button onClick={onContinue} className={cn(button.primary, button.fullWidth)}>
              Continuer
            </button>
          )}

        </div>
      </div>
    </div>
  )
}


// ─── ProgressDots ────────────────────────────────────────────────────────────

const ProgressDots = memo(function ProgressDots({
  current,
  total,
}: {
  current: number
  total: number
}) {
  return (
    <div className="mb-[2em] flex items-center justify-center gap-2">
      {Array.from({ length: total }).map((_, i) => (
        <motion.span
          key={i}
          className={cn('h-1.5 rounded-full', i === current ? 'bg-primary' : 'bg-primary/20')}
          animate={{ width: i === current ? 24 : 6 }}
          transition={DOT_TRANSITION}
        />
      ))}
    </div>
  )
})
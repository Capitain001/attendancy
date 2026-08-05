'use client'

import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'

import { UserInfo } from '@/types/user'
import {
  WelcomeStep,
  InvitationStep,
  RoleStep,
  ConfirmStep,
  type ConfirmStatus,
} from './InvitationSteps'

import { layout } from '@/styles'
import { cn } from '@/lib/utils'


const STEPS = [
  'welcome',
  'invitation',
  'role',
  'confirm',
] as const

type StepKey = (typeof STEPS)[number]


interface InvitationFlowProps {
  user: UserInfo

  /** Appelé quand l'utilisateur accepte l'invitation. Peut être async (appel API). */
  onAccept?: () => void | Promise<void>

  /** Appelé quand l'utilisateur refuse l'invitation. */
  onDecline?: () => void | Promise<void>

  /** Appelé après acceptation, quand l'utilisateur clique "Continuer". */
  onContinue?: () => void
}


export default function InvitationFlow({
  user,
  onAccept,
  onDecline,
  onContinue,
}: InvitationFlowProps) {

  const [stepIndex, setStepIndex] = useState(0)
  const [status, setStatus] = useState<ConfirmStatus>('idle')


  const next = () =>
    setStepIndex((i) =>
      Math.min(i + 1, STEPS.length - 1)
    )


  const back = () =>
    setStepIndex((i) =>
      Math.max(i - 1, 0)
    )


  const handleAccept = async () => {

    setStatus('accepting')

    try {

      await onAccept?.()

      setStatus('accepted')

    } catch {

      setStatus('idle')

    }
  }


  const handleDecline = async () => {

    setStatus('declining')

    try {

      await onDecline?.()

    } finally {

      setStatus('idle')

    }
  }


  const step: StepKey = STEPS[stepIndex]

  const showDots = status !== 'accepted'


  return (

    <div className={cn(layout.centerCol, 'min-h-screen px-[5vw]')}>

      <div className="w-full max-w-[26em]">

        {showDots && (
          <ProgressDots
            current={stepIndex}
            total={STEPS.length}
          />
        )}


        <AnimatePresence mode="wait">

          <motion.div

            key={
              status === 'accepted'
                ? 'accepted'
                : step
            }

            initial={{
              opacity: 0,
              y: 16,
            }}

            animate={{
              opacity: 1,
              y: 0,
            }}

            exit={{
              opacity: 0,
              y: -16,
            }}

            transition={{
              duration: 0.35,
              ease: [0.16, 1, 0.3, 1],
            }}

          >

            {status !== 'accepted' &&
              step === 'welcome' && (

                <WelcomeStep
                  user={user}
                  onNext={next}
                />

              )}



            {status !== 'accepted' &&
              step === 'invitation' && (

                <InvitationStep
                  user={user}
                  onNext={next}
                  onBack={back}
                />

              )}



            {status !== 'accepted' &&
              step === 'role' && (

                <RoleStep
                  user={user}
                  onNext={next}
                  onBack={back}
                />

              )}



            {step === 'confirm' && (

              <ConfirmStep

                user={user}

                status={status}

                onAccept={handleAccept}

                onDecline={handleDecline}

                onBack={back}

                onContinue={onContinue}

              />

            )}

          </motion.div>

        </AnimatePresence>

      </div>

    </div>

  )
}

function ProgressDots({
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

          className={cn(
            'h-1.5 rounded-full',
            i === current
              ? 'bg-primary'
              : 'bg-primary/20'
          )}

          animate={{
            width:
              i === current
                ? 24
                : 6,
          }}

          transition={{
            duration: 0.3,
            ease: [0.16, 1, 0.3, 1],
          }}

        />
      ))}
    </div>

  )
}

'use client'

import { motion } from 'motion/react'
import {
  Building2,
  GraduationCap,
  BookOpen,
  Users,
  UserRound,
  ShieldCheck,
  type LucideIcon,
} from 'lucide-react'
import { ArrowLeft } from 'lucide-react'
import { TextShimmer } from '@/components/ui/text-shimmer'
import UserIcon from '@/components/users/UserIcon'
import { UserInfo } from '@/types/user'
import { button, card, typography, layout } from '@/styles'
import { cn } from '@/lib/utils'

export const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Administrateur',
  TEACHER: 'Enseignant',
  STUDENT: 'Élève',
  PARENT: 'Parent',
  GUEST: 'Invité',
  DIRECTION: 'Direction',
}

const ROLE_ICONS: Record<string, LucideIcon> = {
  ADMIN: ShieldCheck,
  TEACHER: GraduationCap,
  STUDENT: BookOpen,
  PARENT: Users,
  GUEST: UserRound,
  DIRECTION: Building2,
}

interface StepProps {
  user: UserInfo
}

const fadeUp = {
  initial: { scale: 0.85, opacity: 0 },
  animate: { scale: 1, opacity: 1 },
  transition: {
    duration: 0.5,
    ease: [0.16, 1, 0.3, 1] as const,
  },
}


// ─── Étape 1 : Bienvenue ────────────────────────────────────────────────────

export function WelcomeStep({
  user,
  onNext,
}: StepProps & { onNext: () => void }) {
  const displayName =
    user?.name || user?.email?.split('@')[0] || 'Utilisateur'

  return (
    <div className={cn(card.lexical, layout.stack, 'items-center p-[2.5em] text-center')}>
      <motion.div {...fadeUp}>
        <UserIcon
          className="ring-2 ring-primary/25"
          name={displayName}
          avatarUrl={user?.avatar_url}
        />
      </motion.div>

      <TextShimmer className={typography.h4} duration={4}>
        Bienvenue
      </TextShimmer>

      <p className={cn(typography.h4, 'font-medium text-text-primary')}>
        {displayName}
      </p>

      <p className={typography.body}>
        Nous sommes ravis de vous accueillir.
      </p>

      <button
        onClick={onNext}
        className={cn(button.primary, button.fullWidth, 'mt-2')}
      >
        Continuer
      </button>
    </div>
  )
}


// ─── Étape 2 : Invitation ───────────────────────────────────────────────────

export function InvitationStep({
  user,
  onNext,
  onBack,
}: StepProps & {
  onNext: () => void
  onBack: () => void
}) {
  const org = user?.organization

  return (
    <div className={cn(card.lexical, layout.stack, 'items-center p-[2.5em] text-center')}>
      <h1 className={cn(typography.h3, 'tracking-tight border-b-2 border-primary')}>{org?.name}</h1>
      <motion.div {...fadeUp}>
        <UserIcon
          className="ring-2  ring-primary/25"
          name={org?.name}
          avatarUrl={org?.logo}
        />
      </motion.div>

<p className={cn(typography.h4, '')}>
  Vous avez été invité par la direction
</p>

<p className={typography.body}>
  À rejoindre l'établissement{' '}
  <span className="font-bold text-text-primary">
    {org?.name}
  </span>.
</p>

      <div className="mt-2 flex w-full gap-2">
        <button
          onClick={onBack}
          className={cn(button.ghost, 'flex-1')}
        >
          Retour
        </button>

        <button
          onClick={onNext}
          className={cn(button.primary, 'flex-1')}
        >
          Continuer
        </button>
      </div>
    </div>
  )
}

// ─── Étape 3 : Rôle ─────────────────────────────────────────────────────────

export function RoleStep({
  user,
  onNext,
  onBack,
}: StepProps & {
  onNext: () => void
  onBack: () => void
}) {
  const role = user?.role
  const RoleIcon = (role && ROLE_ICONS[role]) || UserRound
  const roleLabel = (role && ROLE_LABELS[role]) || role

  return (
    <div className={cn(card.lexical, layout.stack, 'items-center p-[2.5em] text-center')}>

      <TextShimmer className={"text-2xl font-bold mb-4"} duration={4}>
        Votre profil
      </TextShimmer>
      <div className="flex w-full justify-center gap-8">
        {/* Rôle */}
        <div className="flex flex-col items-center gap-2">
          <motion.div
            {...fadeUp}
            className="flex size-14 items-center justify-center rounded-full bg-muted"
          >
            <RoleIcon
              className="size-6 text-primary"
              strokeWidth={1.75}
            />
          </motion.div>

          <span
            className={cn(
              typography.label,
              'rounded-full bg-primary/10 px-3 py-1 text-primary tracking-wide'
            )}
          >
            {roleLabel}
          </span>
        </div>


        {/* Fonction */}
        {user?.function && (
          <div className="flex flex-col items-center gap-2">
            <motion.div
              {...fadeUp}
              className="flex size-14 items-center justify-center rounded-full bg-muted"
            >
              <UserRound
                className="size-6 text-primary"
                strokeWidth={1.75}
              />
            </motion.div>

            <span
              className={cn(
                typography.label,
                'rounded-full bg-muted px-3 py-1 tracking-wide'
              )}
            >
              {user.function}
            </span>
          </div>
        )}

      </div>

      <p className={typography.body}>
        Votre rôle définit vos accès dans l'établissement.
      </p>


      <div className="mt-2 flex w-full gap-2">

        <button
          onClick={onBack}
          className={cn(button.ghost, 'flex-1')}
        >
          Retour
        </button>


        <button
          onClick={onNext}
          className={cn(button.primary, 'flex-1')}
        >
          Continuer
        </button>

      </div>

    </div>
  )
}

// ─── Étape 4 : Confirmation ─────────────────────────────────────────────────

export type ConfirmStatus =
  | 'idle'
  | 'accepting'
  | 'accepted'
  | 'declining'


interface ConfirmStepProps extends StepProps {
  status: ConfirmStatus
  onAccept: () => void
  onDecline: () => void
  onBack: () => void
  onContinue?: () => void
}


export function ConfirmStep({
  user,
  status,
  onAccept,
  onDecline,
  onBack,
  onContinue,
}: ConfirmStepProps) {
  const org = user?.organization

  const isBusy =
    status === 'accepting' ||
    status === 'declining'


  if (status === 'accepted') {
    return (
      <div className={cn(card.lexical, layout.stack, 'items-center p-[2.5em] text-center')}>
        <SuccessCheck />

        <TextShimmer className={typography.h4} duration={4}>
          Bienvenue dans l'équipe
        </TextShimmer>

        <p className={typography.body}>
          Votre compte est prêt à être configuré.
        </p>

        {onContinue && (
          <button
            onClick={onContinue}
            className={cn(button.primary, button.fullWidth, 'mt-2')}
          >
            Continuer
          </button>
        )}
      </div>
    )
  }


  return (
    <div className={cn(card.lexical, layout.stack, 'relative items-center p-[2.5em] text-center')}>

      {/* Retour apparait ici que pour ce step car on a deja 2 btn de decision*/}
      <button
        onClick={onBack}
        disabled={isBusy}
        className={cn(
          // button.icon,
          'absolute left-4 top-4'
        )}
        aria-label="Retour"
      >
        <ArrowLeft className="size-5" />
      </button>


      <div className="flex items-center gap-3">

        <UserIcon
          className="ring-2 ring-primary/25"
          name={org?.name}
          avatarUrl={org?.logo}
        />


        <div className="h-px w-8 bg-border" />


        <UserIcon
          className="ring-2 ring-border"
          name={user?.name}
          avatarUrl={user?.avatar_url}
        />

      </div>


      <TextShimmer className={typography.h4} duration={4}>
        Rejoindre l'établissement
      </TextShimmer>


      <p className={typography.body}>
        Vous rejoindrez{' '}
        <span className="font-medium text-text-primary">
          {org?.name}
        </span>{' '}
        en tant que{' '}
        <span className="font-medium text-text-primary">
          {ROLE_LABELS[user?.role ?? ''] ?? user?.role}
        </span>.
      </p>


      <div className="mt-2 flex w-full gap-2">

        <button
          onClick={onDecline}
          disabled={isBusy}
          className={cn(button.secondary, 'flex-1')}
        >
          {status === 'declining'
            ? 'Refus…'
            : 'Refuser'}
        </button>


        <button
          onClick={onAccept}
          disabled={isBusy}
          className={cn(button.primary, 'flex-1')}
        >
          {status === 'accepting'
            ? 'Validation…'
            : 'Rejoindre'}
        </button>

      </div>

    </div>
  )
}


function SuccessCheck() {
  return (
    <motion.svg
      width="56"
      height="56"
      viewBox="0 0 56 56"
      fill="none"
      initial="hidden"
      animate="visible"
    >
      <motion.circle
        cx="28"
        cy="28"
        r="26"
        className="stroke-primary"
        strokeWidth="2"
        variants={{
          hidden: { pathLength: 0 },
          visible: { pathLength: 1 },
        }}
        transition={{
          duration: 0.5,
          ease: 'easeOut',
        }}
      />

      <motion.path
        d="M17 29L24.5 36.5L39 20"
        className="stroke-primary"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        variants={{
          hidden: { pathLength: 0 },
          visible: { pathLength: 1 },
        }}
        transition={{
          duration: 0.4,
          ease: 'easeOut',
          delay: 0.4,
        }}
      />
    </motion.svg>
  )
}

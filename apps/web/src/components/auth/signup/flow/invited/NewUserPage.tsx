'use client'

import { useState } from 'react'
import { UserInfo, UserStatus } from '@/types/user'
import InvitationFlow, { type StepDef, type ConfirmDef } from './InvitationFlow'
import { WelcomeStep, InvitationStep, RoleStep, ConfirmStep } from './InvitationSteps'

import { joinOrganizationAction, declineInvitationAction } from '@/modules/auth/members/actions'
import SignupForm from '../../SignupForm'

interface NewUserPageProps {
  user: UserInfo
}

export default function NewUserPage({ user }: NewUserPageProps) {
  const isNewUser = user.status === UserStatus.NEW
  const [showSignupForm, setShowSignupForm] = useState(false)

  const steps: StepDef[] = [
    { key: 'welcome', render: () => <WelcomeStep user={user} /> },
    { key: 'invitation', render: () => <InvitationStep user={user} /> },
    { key: 'role', render: () => <RoleStep user={user} /> },
  ]

  const confirm: ConfirmDef = {
    key: 'confirm',
    render: (status) => <ConfirmStep user={user} status={status} />,
  }

  if (showSignupForm) {
    return (
      <div className="w-full max-w-[26em] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
        <SignupForm />
      </div>
    )
  }

  return (
    <div className="w-full">
      <InvitationFlow
        steps={steps}
        confirm={confirm}
        onAccept={isNewUser ? undefined : joinOrganizationAction}
        onDecline={declineInvitationAction}
        onContinue={isNewUser ? () => setShowSignupForm(true) : undefined}
      />
    </div>
  )
}

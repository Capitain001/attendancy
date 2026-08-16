'use client'

import { useMemo } from 'react'
import { useOrgInvitations } from '@/hooks/data/invitation/use-org-invitations'
import { InvitationTable } from '@/components/invitation/InvitationTable'
import { InviteTeacherDialog } from './InviteTeacherDialog'
import { typography, card } from '@/styles'
import { cn } from '@/lib/utils'
import { CollapseSection } from '@/components/layout/CollapseSection'

export function TeacherInvitationsClient() {
  const { invitations, inviteTeacher, resend, revoke } = useOrgInvitations()

  const teacherInvitations = useMemo(() => {
    return invitations.filter((inv) => inv.details?.role === 'TEACHER')
  }, [invitations])

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h1 className="text-base font-semibold text-text-primary">Invitations Enseignants</h1>
        <InviteTeacherDialog
          onInviteTeacher={(input) => inviteTeacher.mutateAsync(input)}
        />
      </div>

      <div className={cn(card.soft, "p-4")}>
        <p className={cn(typography.body, "text-text-secondary")}>
          Gérez ici les invitations envoyées aux enseignants. 
          Vous pouvez suivre leur statut, relancer une invitation ou la révoquer.
        </p>
      </div>

      <CollapseSection label="Historique des invitations enseignants" count={teacherInvitations.length} defaultOpen>
        <div className={cn(card.soft, "p-1 sm:p-4 overflow-hidden")}>
          <InvitationTable
            invitations={teacherInvitations}
            onResend={(inv) => resend.mutate(inv)}
            onRevoke={(inv) => revoke.mutate(inv)}
            pending={resend.isPending || revoke.isPending}
          />
        </div>
      </CollapseSection>
    </div>
  )
}

'use client'
// Écran classe : inviter des étudiants + historique des invitations de la classe.

import { MetricCard } from '@/components/stats/ui/MetricCard'
import { CollapseSection } from '@/components/layout/CollapseSection'
import { useClassInvitations } from '@/hooks/data/invitation/use-class-invitations'
import { InviteStudentDialog } from './InviteStudentDialog'
import { InvitationTable } from './InvitationTable'

interface ClassInvitationsPageProps {
  classId: string
  className: string
  groups: { id: string; name: string }[]
  title?: boolean;
}

export function ClassInvitationsPage({ classId, className, groups, title= true }: ClassInvitationsPageProps) {
  const { invitations, inviteStudent, resend, revoke } = useClassInvitations(classId)

  const accepted = invitations.filter((i) => i.usedAt).length

  return (
    <div className="space-y-5">
      <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          {title && (
            <h1 className="text-[18px] font-semibold text-foreground">
              Invitations {className ? `— ${className}` : ""}
            </h1>
          )}
          <p className="text-[13px] text-muted-foreground">
            Invitez les étudiants de cette classe et suivez leur inscription.
          </p>
        </div>
        <InviteStudentDialog
          groups={groups}
          onSubmit={(input) => inviteStudent.mutateAsync({ ...input, classId })}
        />
      </div>

      <section className="grid grid-cols-2 gap-3">
        <MetricCard label="Invités" value={String(invitations.length)} sub="au total" />
        <MetricCard label="Acceptées" value={String(accepted)} sub="inscriptions activées" />
      </section>

      <CollapseSection label="Invitations" count={invitations.length} defaultOpen>
        <InvitationTable
          invitations={invitations}
          onResend={(inv) => resend.mutate(inv)}
          onRevoke={(inv) => revoke.mutate(inv)}
          pending={resend.isPending || revoke.isPending}
        />
      </CollapseSection>
    </div>
  )
}

'use client'
// Hub Direction : stats + historique + dialog d'invitation staff.

import { MetricCard } from '@/components/stats/ui/MetricCard'
import { CollapseSection } from '@/components/layout/CollapseSection'
import { useOrgInvitations, useInvitationStats } from '@/hooks/data/invitation/use-org-invitations'
import { InviteDialog } from './InviteDialog'
import { InvitationTable } from './InvitationTable'

interface DirectionInvitationsPageProps {
  functions: { id: string; name: string }[]
}

export function DirectionInvitationsPage({ functions }: DirectionInvitationsPageProps) {
  const { invitations, inviteTeacher, inviteDirection, resend, revoke } = useOrgInvitations()
  const { stats } = useInvitationStats()

  return (
    <div className="space-y-5">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-[18px] font-semibold text-foreground">Invitations</h1>
          <p className="text-[13px] text-muted-foreground">
            Invitez le personnel et suivez l'onboarding.
          </p>
        </div>
        <InviteDialog
          functions={functions}
          onInviteTeacher={(input) => inviteTeacher.mutateAsync(input)}
          onInviteDirection={(input) =>
            inviteDirection.mutateAsync({
              email: input.email,
              name: input.name,
              functions: input.functions ?? [],
            })
          }
        />
      </header>

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <MetricCard label="Total" value={String(stats?.total ?? 0)} sub="invitations" />
        <MetricCard label="En attente" value={String(stats?.pending ?? 0)} sub="à confirmer" />
        <MetricCard label="Acceptées" value={String(stats?.accepted ?? 0)} sub="comptes activés" />
        <MetricCard label="Expirées" value={String(stats?.expired ?? 0)} sub="à relancer" />
      </section>

      <CollapseSection label="Historique" count={invitations.length} defaultOpen>
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
